const { forEach } = require("async");
const pg = require("pg");
const prom_client = require("prom-client");

const connectionString = process.env.DATABASE_CONNECTIONSTRING;
const cp = new pg.Pool({
    connectionString,
    max: 8
})

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



async function rateWithRetry(id, rating, email) {
    return await executeTxWithRetry(rate, flowerid, rating, email);
}

async function rate(id, rating, email) {
    let con = null;
    let start = Date.now();
    let newrating = 0;
    try {
        con = await cp.connect();
        global.sqlTransactions.inc();
       
        global.logger.log("info", "Beginning Transaction at: " + start + "/" + new Date());
        await executeQuery(con, "BEGIN TRANSACTION;");

        let ratingq = "INSERT INTO RATINGS (createdon, stars, "+process.env.MAINTABLE+"id) Values (";
        ratingq += "'" + userid + "', "
        ratingq += "'" + new Date().toISOString() + "', ";
        ratingq += rating + ", '"
        ratingq += id + "');"

        await executeQuery(con, ratingq);
        let nr = await executeQuery(con, "Select a from StarsFor"+process.env.MAINTABLE+" where "+process.env.MAINTABLE+"id='" + id + "';");
        newrating = nr.rows[0].a;
        global.logger.log("info", "New average rating for " + id + " :" + newrating);
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
        global.logger.log("info", "Rating persisted. Transaction commited. Duration: " + (Date.now() - start) + " ms.");
    }
    else {
        global.logger.error("error", "No database connection!");
    }
    return newrating;
}

async function getXML(qn, id) {
    queries = ["select f.xml as xml, r.a as rating, f.id as id from StarsFor"+process.env.MAINTABLE+" r right join flowers f on r.flowerid=f.id order by RANDOM() limit 1;",
        "select f.xml as xml, r.a as rating, f.id as id from StarsFor"+process.env.MAINTABLE+" r right join flowers f on r.flowerid=f.id order by f.createdon desc limit 1; ",
        "select f.xml as xml, r.a as rating, f.id as id from StarsFor"+process.env.MAINTABLE+" r right join flowers f on r.flowerid=f.id order by f.createdon asc limit 1; ",
        "select f.xml as xml, r.a as rating, f.id as id from StarsFor"+process.env.MAINTABLE+" r right join flowers f on r.flowerid=f.id where f.id='" + id + "';"];

    let ret = new Object();
    let con = null;
    try {
        con = await cp.connect();
        let q = queries[qn];
        let result = await executeQuery(con, q);
        ret.xml = result.rows[0].xml;
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


async function executeSQL(sql) {
    let ret = new Object();
    let con = null;
    try {
        con = await cp.connect();
        ret = await executeQuery(con, sql);
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

async function executeQuery(con, query) {
    let start = Date.now();
   
    let lq= query.toLowerCase().trim();
    let promlabel = lq;
    if (promlabel.includes("where")) {
        promlabel = query.substring(0, promlabel.indexOf("where"));
    }
    if (promlabel.includes("values")) {
        promlabel = query.substring(0, promlabel.indexOf("values"));
    }
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
        res= await con.query(query);
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
        global.logger.log("info", "Row 0: " + JSON.stringify(res.rows[0]).substring(0, Math.max(256, r.length)));
    }
    global.sqlQueryDurationMilliseconds
        .labels(promlabel)
        .observe(new Date() - start);
   
    return res;
}


async function persistWithRetry(jobj, xml, email) {
    return await executeTxWithRetry(persist, jobj, xml, email);
}

async function persist(jobj, xml, email) {
    global.logger.log("info", "Persisting item.");
    let con = null;
    let start = Date.now();
    let ret = {};
    try {
        con = await cp.connect();
        global.sqlTransactions.inc();
      
        global.logger.log("info", "Beginning Transaction at: " + start + "/" + new Date());
        await executeQuery(con, "BEGIN TRANSACTION;");
       
        let desc = jobj.svg.desc.split(" ")
        let ri = 0;

        let data = {
            name: (desc[0].split("=")[1]).replaceAll("'", ""),
            origin: desc[1].split("=")[1].replaceAll("'", ""),
            stars: parseInt(desc[5].split("=")[1]),
        }

        let user = await executeQuery(con, "Select id from users where email='" + email + "'");
        let userid = user.rows[0].id;
        let flower = "INSERT INTO Flowers (createdby, createdon, xml, json, transformation, blossomtransformation, origin) Values (";
        flower += "'" + userid + "', "
        flower += "'" + new Date().toISOString() + "', ";
        flower += "'" + xml + "', ";
        flower += "'" + JSON.stringify(data) + "', ";
        flower += "'" + data.origin + "'";
        flower += ") RETURNING ID;";
        let flowerrows = await executeQuery(con, flower);
        let flowerid = flowerrows.rows[0].id;
        global.logger.log("info", "ID: " + flowerid);

        if (data.stars >= 1 && data.stars <= 5) {
            let rating = "INSERT INTO Stars (createdby, createdon, stars, flowerid) Values (";
            rating += "'" + userid + "', "
            rating += "'" + new Date().toISOString() + "', ";
            rating += data.stars + ", '"
            rating += flowerid + "');"

            await executeQuery(con, rating);
        }
        ret = flowerid;
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