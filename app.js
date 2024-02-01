var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const session = require('express-session');
const basicAuth = require('express-basic-auth');
const axios = require("axios");
var url  = require('url');
var http = require('http');
var fs = require('fs');

var bodyParser = require('body-parser');
var app = express();
global.app = app;

function requireHTTPS(req, res, next) {
  // The 'x-forwarded-proto' check is for Heroku
  if (!req.secure && req.get('x-forwarded-proto') !== 'https' && process.env.NODE_ENV !== "development") {
    return res.redirect('https://' + req.get('host') + req.url);
  }
  next();
}

if(typeof process.env.REGION=== "undefined" ) {
  process.env.REGION= "Region";
}
let config= { "OAUTH2_CLIENT_ID": "none", "OAUTH2_CLIENT_SECRET": "xxx", "OAUTH2_CALLBACK": "http://localhost:3000/auth/google/callback" }

let store = new session.MemoryStore();

const sessionConfig = {
  resave: false,
  saveUninitialized: false,
  secret: config.OAUTH2_CLIENT_SECRET,
  signed: true,
  store: store
};

app.use(session(sessionConfig));
global.sessionstore = store;
require("./o11y");
//app.use(requireHTTPS);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.text({ type: '*/*',limit: '50mb' }));
app.use(bodyParser.raw({limit: '50mb'}));
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware that requires the user to be logged in. If the user is not logged
// in, it will redirect the user to authorize the application and then return
// them to the original URL they requested.
function authRequired(req, res, next) {
  if (!req.user) {
    if (req.session.authorizedByKey == true) {
      next();
      return;
    }
    return res.redirect('/');
  }
  next();
}

// Middleware that exposes the user's profile as well as login/logout URLs to
// any templates. These are available as `profile`, `login`, and `logout`.
function addTemplateVariables(req, res, next) {
  res.locals.profile = req.user;
  res.locals.login = "/"
  next();
}


app.use('/app', authRequired);
app.use('/app/*', authRequired);

let index = require('./routes/index.js');

app.use('/', index);

app.use(function (req, res, next) {
  let start = new Date();
  var err = new Error('Not Found');
  err.status = 404;
  err.route = "/";
  err.route.path = "/";
  var url_parts = url.parse(req.url);
  next(err);
  global.httpRequestDurationMilliseconds
  .labels(url_parts.pathname, err.status, req.method)
  .observe(new Date() - start);
});

index.get( 
  '/logout', (req, res, next) => {
    let start= Date.now();
    if (req.session) {
      global.logger.log("info", "User logged out.");
      req.session.destroy(err => {
      });
    } else {
      res.end()
    }
    res.redirect("/");
    global.httpRequestDurationMilliseconds
    .labels(req.route.path, res.statusCode, req.method)
    .observe(new Date() - start);
  });

// error handler
app.use(function (err, req, res, next) {
  let start = new Date();
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  route= req.path | req.url | 'unknown';
  res.render('error', { message: err.message, error: err, route: route , backgroundcolor: process.env.BACKGROUNDCOLOR, backgroundimage: process.env.BACKGROUNDIMAGE, color: process.env.COLOR, title: process.env.TITLE});
  global.httpRequestDurationMilliseconds
    .labels(req.url, res.statusCode, req.method)
    .observe(new Date() - start);
 });

 

module.exports = app;
