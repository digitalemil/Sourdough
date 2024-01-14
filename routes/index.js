let express = require("express");
let router = express.Router();
const { XMLParser, XMLBuilder, XMLValidator } = require("fast-xml-parser");
const { rate, persist, executeSQL, authenticateUser, getXML } = require("../private/persistence.js");
const fs = require('fs');
let url = require('url');

router.all("/signinwithkey", async function (req, res, next) {
  if (process.env.CODE == "" || ! (process.env.CODE != undefined)) {
    res.status(401).send("unauthorized");
    return;
  }
  if (req.header('x-api-key') == process.env.CODE) {
    let user= req.body.split("/")[0].trim();
    let password= req.body.split("/")[1].trim();
    if (await authenticateUser(user, password)) {
      req.session.authorizedByKey = true;
      req.session.passport = { "user": { "name": { "value": user } } };
      res.redirect('/app/home');
      return;
    }
  }
  res.status(401).send("unauthorized");
});

router.get(['/app/sql.html'], function (req, res, next) {
  let start = new Date();
  res.render('sql', { table: process.env.MAINTABLE, farourl: process.env.FAROURL, farokey: process.env.FAROKEY });
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
  return;
});
router.get("/", function (req, res, next) {
  let start = new Date();
  res.render("index", { code: process.env.CODE,img: "true" == process.env.BLACK ? "images/rosenoir.png" : "images/rose.png", contentbackgroundcolor: "true" == process.env.BLACK ? "#808080" : process.env.CONTENTBACKGROUNDCOLOR, text_color: process.env.TEXT_COLOR, title: process.env.TITLE, welcome: process.env.WELCOME });
  global.httpRequestDurationMilliseconds
    .labels(req.route.path, res.statusCode, req.method)
    .observe(new Date() - start);
});

function renderHome(req, res, next, home, action, id) {
  res.render(home, { stars: process.env.STARSTEXT, code: process.env.CODE, id: id, action: action, contentbackgroundcolor: process.env.CONTENTBACKGROUNDCOLOR, text_color: process.env.TEXT_COLOR, title: process.env.TITLE });
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
  let r = await getXML(0);

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
  let r = await getXML(1);

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
  let r = await getXML(2);
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

  fs.readFile("private/creator.js", "utf8", function (err, js) {
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

  fs.readFile("private/lafleur.svg", "utf8", function (err, data) {
    if (err) {
      global.logger.log("error", "Can't find docs file.");
    }
    res.send(data);
    global.httpRequestDurationMilliseconds
      .labels(req.route.path, res.statusCode, req.method)
      .observe(new Date() - start);
  })
});

router.get("/app/er", function (req, res, next) {
  let start = new Date();
  res.render("lesfleurs-er", { title: process.env.TITLE });
  global.httpRequestDurationMilliseconds
    .labels(req.route.path, res.statusCode, req.method)
    .observe(new Date() - start);
});


router.get("/app/er.png", function (req, res, next) {
  let start = new Date();

  fs.readFile("private/FlowersDB.png", function (err, data) {
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

router.get("/app/ddl", function (req, res, next) {
  let start = new Date();

  fs.readFile("./private/lesfleurs-ddl.sql", "utf8", function (err, data) {
    if (err) {
      global.logger.log("error", "Can't find docs file.");
    }

    res.render("lesfleurs-ddl", { ddl: data });

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

router.post("/app/rose", async function (req, res, next) {
  let start = new Date();

  await ingest(req, res, next, false);
  global.httpRequestDurationMilliseconds
    .labels(req.route.path, res.statusCode, req.method)
    .observe(new Date() - start);
});

async function ingest(req, res, next, replay) {
  let start = new Date();
  global.logger.log("info", "Ingesting item."+req.body);
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