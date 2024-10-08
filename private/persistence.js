const { forEach } = require("async");
const pg = require("pg");
const prom_client = require("prom-client");

String.prototype.hashCode = function() {
    var hash = 0,
      i, chr;
    if (this.length === 0) return hash;
    for (i = 0; i < this.length; i++) {
      chr = this.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
}
if(typeof process.env.VERSION=== "undefined" || process.env.VERSION==="") {
    process.env.VERSION= "1.0";
}

console.log("Version: "+process.env.VERSION)
let connectionsInUse= 0;
const connectionString = process.env.DATABASE_CONNECTIONSTRING;
console.log("DB Connection for: "+process.env.REGION+" "+connectionString);
const cp = new pg.Pool({
    connectionString,
    max: 8,
    statement_timeout: 8000
})

cp.on('acquire', (client) => {
    connectionsInUse++;
    global.sqlConnections.set(connectionsInUse);
    global.logger.log("info", "Connection acquired. In use: "+connectionsInUse);
});
cp.on('release', (err, client) => {
    connectionsInUse--;
    global.sqlConnections.set(connectionsInUse);
    global.logger.log("info", "Connection released. In use: "+connectionsInUse);
});

executeSQL("Update UserDetails Set password_hash = '"+process.env.CODE.hashCode()+"'");
async function authenticateUser(user, password) {
    let pw= new Object();
    pw.password= false;
    let con= null;
    try {
        con = await cp.connect();
        let result= await executeQuery(con, "Select password_hash, location from UserDetails where name=$1;", [user]);
        pw.password= result.rows[0].password_hash;
        pw.region= result.rows[0].location;
    }
    catch (err) {
        if((! (err!= undefined)) || JSON.stringify(err)=== "{}") {
            global.logger.log("info", "Can't authenticate user: "+user);
        }
        global.logger.log("error", err);
        if (undefined != con && con != null) {
            try {
                con.release();
            }
            catch (ex2) {
                global.logger.log("error", ex2);
            }
        }
        return false;
    }
    con.release();
    let ret= new Object();
    ret.region= pw.region;
    ret.authenticated= false;
    ret.user= user;
    if(pw.password && (pw.password == password.hashCode()))
        ret.authenticated= true;
    if(ret) {
        global.logger.log("info", "User: " + user + " authenticated.");
    }
    else {
        global.logger.log("error", "User: " + user + " NOT authenticated.");
    }
    return ret;
}

async function executeTxWithRetry(tx, ...args) {
    const maxRetries = 5;
    const backOff = 100;
    let tries = 0;
    let result= null;

    while (tries < maxRetries) {
        try {
            result = await tx(...args);
            if ('40001' === result) {
                global.sqlRetries.inc();
                await new Promise((r) => setTimeout(r, tries * backOff));
                global.logger.log("info", "Retrying Transaction at: " + start + "/" + new Date()+ " attempt: "+ (tries+1));
            } 
            else {
                global.sqlIsUp.set(1);
                return result;
            }
        }
        catch (err) {
            global.logger.log("error", err.toString());
            global.sqlIsUp.set(0);
            return result;
        }
        tries++;
        if(tries== maxRetries) {
            global.logger.log("error", "Max retries reached. Giving up");
        }
    }
    return result;
}



async function rateWithRetry(id, rating, username) {
    return await executeTxWithRetry(rate, id, rating, username);
}

async function rate(id, rating, username) {
    let con = null;
    let start = Date.now();
    let newrating = 0;
    try {
        con = await cp.connect();
        global.sqlTransactions.inc();
       
        global.logger.log("info", "Beginning Transaction at: " + start + "/" + new Date());
        await executeQuery(con, "BEGIN TRANSACTION;");

        let userrows = await executeQuery(con, "Select id from UserDetails where name=$1;", [username]);
        let userid= userrows.rows[0].id;

        global.logger.log("info", "Persisting "+process.env.SECONDTABLE+" for UserID: "+userid);

        let ratingq = "INSERT INTO "+process.env.SECONDTABLE+" (createdby, createdon, "+process.env.STARS+", itemid) Values ($1, $2, $3, $4) RETURNING id;";

        await executeQuery(con, ratingq, [userid, new Date().toISOString(), rating, id]);
        let nr = await executeQuery(con, "Select a from "+process.env.SECONDTABLE+"For"+process.env.MAINTABLE+" where itemid=$1;", [id]);
        newrating = nr.rows[0].a;
        global.logger.log("info", "New average for " + id + " :" + newrating);
    }
    catch (err) {
        global.logger.log("error", err);

        if (undefined != con && con != null) {
            try {
                global.logger.log("error", "Rolling back transaction.");
                executeQuery(con, "ROLLBACK;");
                con.release();
                global.sqlRollbacks.inc();

                if (err.code !== '40001') {
                    throw err;
                }
                // err.code === '40001'
                // let's retry
                return err.code;
            }
            catch (ex2) {
                global.logger.log("error", ex2);
            }
        }
        return null;
    }
    if (undefined != con && con != null) {
        executeQuery(con, "COMMIT;");
        con.release();
        global.sqlCommits.inc();
        global.logger.log("info", process.env.SECONDTABLE+" Persisted. Transaction commited. Duration: " + (Date.now() - start) + " ms.");
    }
    else {
        global.logger.error("error", "No database connection!");
    }
    return newrating;
}

async function getXML(qn, id, name, itemname) {

    let ret = new Object();
    let con = null;
    try {
        con = await cp.connect();
        let userlocation= null;
        if(name == undefined) {
            userlocation= await executeQuery(con, "SELECT location from UserDetails order by RANDOM() limit 1;");      
        }
        else {
            userlocation= await executeQuery(con, "SELECT location from UserDetails where name=$1;", [name]);
        }
        let origin= userlocation.rows[0].location;


        queries = ["select f.xml as xml, r.a as rating, f.id as id from "+process.env.SECONDTABLE+"For"+process.env.MAINTABLE+" r right join "+process.env.MAINTABLE+" f on r.itemid=f.id where f.origin='"+origin+"' order by RANDOM() limit 1;",
        "select f.xml as xml, r.a as rating, f.id as id from "+process.env.SECONDTABLE+"For"+process.env.MAINTABLE+" r right join "+process.env.MAINTABLE+" f on r.itemid=f.id where f.origin='"+origin+"' order by f.createdon desc limit 1; ",
        "select f.xml as xml, r.a as rating, f.id as id from "+process.env.SECONDTABLE+"For"+process.env.MAINTABLE+" r right join "+process.env.MAINTABLE+" f on r.itemid=f.id where f.origin='"+origin+"' order by f.createdon asc limit 1; ",
        "select f.xml as xml, r.a as rating, f.id as id from "+process.env.SECONDTABLE+"For"+process.env.MAINTABLE+" r right join "+process.env.MAINTABLE+" f on r.itemid=f.id where f.origin='"+origin+"' AND f.id='" + id + "';",
        "select f.xml as xml, r.a as rating, f.id as id from "+process.env.SECONDTABLE+"For"+process.env.MAINTABLE+" r right join "+process.env.MAINTABLE+" f on r.itemid=f.id where f.origin='"+origin+"' AND f.name='\"" + itemname + "\"' limit 1;"];

        let q = queries[qn];
        let result = await executeQuery(con, q);
        ret.xml = result.rows[0].xml;

        ret.xml= ret.xml.replace("</style>", '</style><text x="800" y="64" class="big">'+origin+'</text>');
        ret.rating = result.rows[0].rating;
        ret.id = result.rows[0].id;
    }
    catch (ex) {
        if (undefined != con && con != null) {
            try {
                global.logger.log("error", "Can not retrieve item: " + ex);
                con.release();
                return null;
            }
            catch (ex2) {
                global.logger.log("error", ex2);
            }
        }
        return null;
    }
    con.release();

    return ret;
};


async function executeSQL(sql, values) {
    let ret = new Object();
    let con = null;
    try {
        con = await cp.connect();
        ret = await executeQuery(con, sql, values);
    }
    catch (err) {
        global.logger.log("error", "Can not execute SQL: " + err.toString());
        if (undefined != con && con != null) {
            try {
                con.release();
                return null;
            }
            catch (ex2) {
                global.logger.log("error", ex2);
            }
        }
        return null;
    }
    con.release();

    return ret;
};

async function executeQuery(con, query, values) {
    let start = Date.now();
   
    let lq= query.toLowerCase().trim();
    let promlabel = lq;
    if (promlabel.includes("where")) {
        promlabel = query.substring(0, promlabel.indexOf("where"));
    }
    if (promlabel.includes("values")) {
        promlabel = query.substring(0, promlabel.indexOf("values"));
    }
    promlabel= promlabel.substring(0, Math.floor(Math.min(64), promlabel.length));
   
    if(lq.startsWith("insert")) 
        global.sqlInserts.labels(promlabel).inc();
    if(lq.startsWith("delete"))
        global.sqlDeletes.labels(promlabel).inc();
    if(lq.startsWith("upsert"))
        global.sqlUpserts.labels(promlabel).inc();
    if(lq.startsWith("update"))
        global.sqlUpdates.labels(promlabel).inc();
    if(lq.startsWith("select"))
        global.sqlSelects.labels(promlabel).inc();
    global.sqlQueries.labels(promlabel).inc();

    global.logger.log("info", "SQL: " + query.substring(0, Math.min(256, query.length)));
    if (query.length > 256) {
        global.logger.log("info", "\tQuery Truncated. Total length: " + query.length);
    }
    let res;
    try {
        res= await con.query(query, values);
    }
    catch(err) {
        global.logger.log("error", "Can't execute query: "+query.substring(0, Math.max(128, query.length)));
        global.logger.log("error", err.toString());
        global.sqlErrors.inc();
        global.sqlIsUp.set(0);
        global.logger.log("info", "Duration: " + (Date.now() - start) + "ms.");
        return null;
    }
    global.sqlIsUp.set(1);
    global.logger.log("info", "Duration: " + (Date.now() - start) + "ms. Rows: " + res.rows.length);
    if (res.rows.length == 1) {
        let r = JSON.stringify(res.rows[0]);
        let len= r.length;
        global.logger.log("info", "Row 0: " + r.substring(0, Math.min(256, len)));
    }
    global.sqlQueryDurationMilliseconds
        .labels(promlabel)
        .observe(new Date() - start);
   
    return res;
}


async function persistWithRetry(jobj, xml, username) {
    return await executeTxWithRetry(persist, jobj, xml, username);
}

async function persist(jobj, xml, username) {
    global.logger.log("info", "Persistence persist method.");
    let con = null;
    let start = Date.now();
    let ret = {};
    try {
        con = await cp.connect();
        global.sqlTransactions.inc();
      
        global.logger.log("info", "Beginning Transaction at: " + start + "/" + new Date());
        await executeQuery(con, "BEGIN TRANSACTION;");
      
        let userrows = await executeQuery(con, "Select id, location, email from UserDetails where name=$1;", [username]);
        let userid= userrows.rows[0].id;
        let origin= userrows.rows[0].location;
        let email= userrows.rows[0].email;
        global.logger.log("info", "Persisting item for UserID: "+userid);

        let desc = jobj.svg.desc.split(" star")
        let ri = 0;
        let data = {
            name: (desc[0].split("=")[1]).replaceAll("'", ""),
            origin: origin,
            stars: parseInt(desc[1].split("=")[1]),
            doc: jobj
        }
        if(JSON.stringify(jobj).length>= 1000*1000) {
            data.doc= { warning: "json too long"}
        }
        let v= 0;
        if(process.env.VERSION==="2.0") {
            v= 1;
        }
        else {
            if(process.env.VERSION==="3.0") {
                v= 2;
            }
        }
        let vs= [ ["",""], [", xml_length", (","+xml.length)], [", xml_length, email", (","+xml.length+", '"+email+"'")] ];
        let item = "INSERT INTO "+process.env.MAINTABLE+" (createdby, createdon, xml, json, origin" +vs[v][0]+") Values ($1, $2, $3, $4, $5) RETURNING ID;";
        let values= [userid,new Date().toISOString(), xml, JSON.stringify(data), data.origin+vs[v][1]];
        let itemrows = await executeQuery(con, item, values);
        let itemid = itemrows.rows[0].id;
        global.logger.log("info", "Item created. ID: " + itemid);

        if (data.stars >= 1 && data.stars <= 5) {
            let rating = "INSERT INTO "+process.env.SECONDTABLE+" (createdby, createdon, "+process.env.STARS+", itemid) Values ($1, $2, $3, $4);";
            values= [userid, new Date().toISOString(), data.stars, itemid];
            await executeQuery(con, rating, values);
        }
        ret = itemid;
    }
    catch (err) {
        global.logger.log("error", err);

        if (undefined != con && con != null) {
            try {
                global.logger.log("error", "Rolling back transaction.");
                executeQuery(con, "ROLLBACK;");
                con.release();
                global.sqlRollbacks.inc();

                if (err.code !== '40001') {
                    throw err;
                }
                // err.code === '40001'
                // let's retry
                return err.code;
            }
            catch (ex2) {
                global.logger.log("error", ex2);
            }
        }
        throw err;
    }
    if (undefined != con && con != null) {
        executeQuery(con, "COMMIT;");
        con.release();
        global.sqlCommits.inc();
      
        global.logger.log("info", "Item persisted: '" + ret + "'. Transaction commited. Duration: " + (Date.now() - start) + " ms.");
    }
    else {
        global.logger.error("error", "No database connection!");
    }
    return ret;
};

exports.persist = persistWithRetry;
exports.rate = rateWithRetry;
exports.executeSQL= executeSQL;
exports.authenticateUser= authenticateUser;
exports.getXML= getXML;