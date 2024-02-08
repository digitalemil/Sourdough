let express = require("express");
let router = express.Router();
const { XMLParser, XMLBuilder, XMLValidator } = require("fast-xml-parser");
const { rate, persist, executeSQL, authenticateUser, getXML } = require("../private/persistence.js");

let creatorfile= process.env.CREATORFILE;

if(creatorfile==="./private/creator.js") {
  creatorfile= "."+creatorfile;
}
let user= "", userregion= "";

const { createSVG } = require(creatorfile);
const fs = require('fs');
let url = require('url');
let http = require('http');
 
function download(url, dest, cb) {
  var file = fs.createWriteStream(dest);
  http.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close(cb);
    });
  });
};

downloadCreator();

async function downloadCreator() { 
  if(process.env.CREATORFILE.startsWith("http")) {
    download(process.env.CREATORFILE, process.env.LOGFOLDER+"/creator.js")
  }
}


router.get(["/random/withkey", "/random/withcode"], async function (req, res, next) {
  let start = new Date();

  let code = req.query.code;

  if (process.env.CODE == "" || !(process.env.CODE != undefined) || code != process.env.CODE) {
    res.render("error", { message: "Invalid Code.", error: "Invalid Code.", backgroundcolor: process.env.BACKGROUNDCOLOR, inputcolor: process.env.INPUTCOLOR, backgroundimage: process.env.BACKGROUNDIMAGE, color: process.env.COLOR, title: process.env.TITLE });
    global.httpRequestDurationMilliseconds
      .labels(req.route.path, res.statusCode, req.method)
      .observe(new Date() - start);
    return;
  }

  let r = await getXML(0);

  if (r == undefined || r.xml == undefined) {
    res.render("error", { route: req.path, message: "No item found.", error: "No item found.", backgroundcolor: process.env.BACKGROUNDCOLOR, inputcolor: process.env.INPUTCOLOR, backgroundimage: process.env.BACKGROUNDIMAGE, color: process.env.COLOR, title: process.env.TITLE });
  }
  else {
    res.setHeader("image", "svg+xml");
    res.send(r.xml.replaceAll("'", "\""));
  }
  global.httpRequestDurationMilliseconds
    .labels(req.route.path[0], res.statusCode, req.method)
    .observe(new Date() - start);
});

router.post("/create", async function (req, res, next) {
  let start = new Date();

  if (process.env.CODE == "" || !(process.env.CODE != undefined)) {
    res.status(401).send("unauthorized");
    global.httpRequestDurationMilliseconds
      .labels(req.route.path, res.statusCode, req.method)
      .observe(new Date() - start);
    return;
  }

  if (req.header('x-api-key') == process.env.CODE) {
    user = req.body.split("/")[0].trim();
    let password = req.body.split("/")[1].trim();
    let a= await authenticateUser(user, password)
    if (a.authenticated) {
      globalThis.userregion= a.region;   
      globalThis.user= user; 
      console.log("R: "+ globalThis.userregion);
      let svg = createSVG();
      svg = svg.replaceAll("</desc>", " stars=0</desc>");
      const options = {
        ignoreAttributes: false,
        attributeNamePrefix: ""
      };
      const parser = new XMLParser(options);
      let jobj = parser.parse(svg);
      let ret = "503"
      try {
        ret = await persist(jobj, svg, user);
      }
      catch (err) {
      }
      res.send(ret);
    }
    else {
      res.status(401).send("unauthorized");
    }
  }
  global.httpRequestDurationMilliseconds
    .labels(req.route.path, res.statusCode, req.method)
    .observe(new Date() - start);

});

router.all("/signinwithkey", async function (req, res, next) {
  let start = new Date();

  if (process.env.CODE == "" || !(process.env.CODE != undefined)) {
    res.status(401).send("unauthorized");
    global.httpRequestDurationMilliseconds
      .labels(req.route.path, res.statusCode, req.method)
      .observe(new Date() - start);
    return;
  }

  if (req.header('x-api-key') == process.env.CODE) {
    let user = req.body.split("/")[0].trim();
    let password = req.body.split("/")[1].trim();
    let a= await authenticateUser(user, password)
    if (a.authenticated) {
      req.session.authorizedByKey = true;
      req.session.passport = { "user": { "name": { "value": user }, "region": a.region } };
      res.redirect('/app/home');
      global.httpRequestDurationMilliseconds
        .labels(req.route.path, res.statusCode, req.method)
        .observe(new Date() - start);

      return;
    }
  }
  res.status(401).send("unauthorized");
  global.httpRequestDurationMilliseconds
    .labels(req.route.path, res.statusCode, req.method)
    .observe(new Date() - start);

});

router.get(['/app/sql.html'], async function (req, res, next) {
  let start = new Date();
  res.render('sql', { table: process.env.MAINTABLE, farourl: process.env.FAROURL, farokey: process.env.FAROKEY, backgroundcolor: process.env.BACKGROUNDCOLOR, inputcolor: process.env.INPUTCOLOR, backgroundimage: process.env.BACKGROUNDIMAGE, color: process.env.COLOR, title: process.env.TITLE });
  
  try {
  global.httpRequestDurationMilliseconds
  .labels(req.route.path, res.statusCode, req.method)
    .observe(new Date() - start);
  }
  catch(err) {}
});

router.get(['/app/sql'], async function (req, res, next) {
  let start = new Date();

  let url_parts = url.parse(req.url, true);
  let query = url_parts.query;
  let sql = query.cmd;

  try {
    let results = await executeSQL(sql);
    if (results.rows) {
      results.rows.forEach(function (row) {
        res.write(JSON.stringify(row) + "\n\n");
      });
    }
  }
  catch (ex) {
    global.logger.log("error", 'Error executing sql: ' + sql, ex);
  }
  res.end();
  try {
 
  global.httpRequestDurationMilliseconds
    .labels(req.route.path, res.statusCode, req.method) 
    .observe(new Date() - start);
  }
  catch(err) {}
  return;
});

router.get("/", function (req, res, next) {
  let start = new Date();
  res.render("index", { appregion: process.env.REGION, logo: process.env.LOGO, code: process.env.CODE, backgroundcolor: process.env.BACKGROUNDCOLOR, inputcolor: process.env.INPUTCOLOR, color: process.env.COLOR, backgroundimage: process.env.BACKGROUNDIMAGE, title: process.env.TITLE, welcome: process.env.WELCOME });
  global.httpRequestDurationMilliseconds
    .labels(req.route.path, res.statusCode, req.method)
    .observe(new Date() - start);
});

function renderHome(req, res, next, home, action, id) {
  res.render(home, {
    appregion:process.env.REGION, user: req.session.passport.user.name.value, userregion: req.session.passport.user.region, farourl: process.env.FAROURL, farokey: process.env.FAROKEY,
    stars: process.env.STARS, code: process.env.CODE, id: id, action: action, backgroundcolor: process.env.BACKGROUNDCOLOR, inputcolor: process.env.INPUTCOLOR, backgroundimage: process.env.BACKGROUNDIMAGE, color: process.env.COLOR, title: process.env.TITLE
  });
};

router.get("/app/home", function (req, res, next) {
  let start = new Date();

  renderHome(req, res, next, "home", 'createFleur()', '0');
  global.httpRequestDurationMilliseconds
    .labels(req.route.path, res.statusCode, req.method)
    .observe(new Date() - start);
});

router.get("/app/random", async function (req, res, next) {
  let start = new Date();
  let user = req.query.user;
  let r = await getXML(0, null, req.session.passport.user.name.value);

  if (r == undefined || r.xml == undefined) {
    renderHome(req, res, next, "home", "");
  }
  else {
    renderHome(req, res, next, "home", "showExisting(`" + r.xml + "`, " + r.rating + ", '" + r.id + "');");

  }
  global.httpRequestDurationMilliseconds
    .labels(req.route.path, res.statusCode, req.method)
    .observe(new Date() - start);
});

router.get("/app/search", async function (req, res, next) {
  let start = new Date();
  let itemname = req.query.name;
  if (itemname.startsWith('"')) {
    itemname = itemname.replace(/"/g, "");
  }

  let r = await getXML(4, null, req.session.passport.user.name.value, itemname);

  if (r == undefined || r.xml == undefined) {
    renderHome(req, res, next, "home", "");
  }
  else {
    renderHome(req, res, next, "home", "showExisting(`" + r.xml + "`, " + r.rating + ", '" + r.id + "');");

  }
  global.httpRequestDurationMilliseconds
    .labels(req.route.path, res.statusCode, req.method)
    .observe(new Date() - start);
});

router.get("/app/last", async function (req, res, next) {
  let start = new Date();
  let user = req.query.user;
  let r = await getXML(1, null, req.session.passport.user.name.value);


  if (r == undefined || r.xml == undefined) {
    renderHome(req, res, next, "home", "");
  }
  else {
    renderHome(req, res, next, "home", "showExisting(`" + r.xml + "`, " + r.rating + ", '" + r.id + "');");
  }
  global.httpRequestDurationMilliseconds
    .labels(req.route.path, res.statusCode, req.method)
    .observe(new Date() - start);
});

router.get("/app/first", async function (req, res, next) {
  let start = new Date();
  let user = req.query.user;
  let r = await getXML(2, null, req.session.passport.user.name.value);

  if (r == undefined || r.xml == undefined) {
    renderHome(req, res, next, "home", "");
  }
  else {
    renderHome(req, res, next, "home", "showExisting(`" + r.xml + "`, " + r.rating + ", '" + r.id + "');");
  }
  global.httpRequestDurationMilliseconds
    .labels(req.route.path, res.statusCode, req.method)
    .observe(new Date() - start);
});

router.post("/app/rating", async function (req, res, next) {
  let promstart = new Date();

  global.logger.log("info", "Persisting rating: " + req.body.rating);

  let newrating = await rate(req.body.id, req.body.rating, req.session.passport.user.name.value);

  res.send(newrating);
  global.httpRequestDurationMilliseconds
    .labels(req.route.path, res.statusCode, req.method)
    .observe(new Date() - promstart);

});

router.get("/app/creator.js", function (req, res, next) {
  let start = new Date();
  let creatorfile= process.env.CREATORFILE;
  if(creatorfile.startsWith("http"))
    creatorfile= process.env.LOGFOLDER+"/creator.js";
  
  global.logger.log("info", "Creator file: "+creatorfile+"  "+process.env.CREATORFILE);
  fs.readFile(creatorfile, "utf8", function (err, js) {
    if (err) {
      global.logger.log("error", "Can't find creator file.");
    }
    res.send(js);
    global.httpRequestDurationMilliseconds
      .labels(req.route.path, res.statusCode, req.method)
      .observe(new Date() - start);
  })
});

router.get("/app/docsvg", function (req, res, next) {
  let start = new Date();

  fs.readFile("private/sourdough-er.png", function (err, data) {
    if (err) {
      global.logger.log("error", "Can't find docs file.");
    }
    res.setHeader('content-type', 'image/png');

    res.send(data);
    global.httpRequestDurationMilliseconds
      .labels(req.route.path, res.statusCode, req.method)
      .observe(new Date() - start);
  })
});

router.get("/app/er", function (req, res, next) {
  let start = new Date();
  res.render("er", { title: process.env.TITLE });
  global.httpRequestDurationMilliseconds
    .labels(req.route.path, res.statusCode, req.method)
    .observe(new Date() - start);
});


router.get("/app/er.png", function (req, res, next) {
  let start = new Date();

  fs.readFile("private/sourdough-er.png", function (err, data) {
    if (err) {
      global.logger.log("error", "Can't find Er image.");
    }
    res.setHeader('content-type', 'image/png');
    res.send(data);
    global.httpRequestDurationMilliseconds
      .labels(req.route.path, res.statusCode, req.method)
      .observe(new Date() - start);
  })
});

router.get("/app/ddl", function (req, res, next) {
  let start = new Date();

  fs.readFile("./private/ddl.sql", "utf8", function (err, data) {
    if (err) {
      global.logger.log("error", "Can't find docs file.");
    }

    res.render("ddl", { ddl: data });

    global.httpRequestDurationMilliseconds
      .labels(req.route.path, res.statusCode, req.method)
      .observe(new Date() - start);
  })
});

router.get("/nouser", function (req, res, next) {
  let start = new Date();
  res.render("nouser", { title: process.env.TITLE });
  global.httpRequestDurationMilliseconds
    .labels(req.route.path, res.statusCode, req.method)
    .observe(new Date() - start);
});

router.post("/app/item", async function (req, res, next) {
  let start = new Date();

  await ingest(req, res, next, false);
  global.httpRequestDurationMilliseconds
    .labels(req.route.path, res.statusCode, req.method)
    .observe(new Date() - start);
});

async function ingest(req, res, next, replay) {
  let start = new Date();
  global.logger.log("info", "Ingesting item.");
  res.statusCode = 200;
  const options = {
    ignoreAttributes: false,
    attributeNamePrefix: ""
  };
  const parser = new XMLParser(options);
  let jobj = parser.parse(req.body);
  let ret = await persist(jobj, req.body, req.session.passport.user.name.value);
  res.send(ret)
};

module.exports = router;