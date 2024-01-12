let express = require("express");
let router = express.Router();
const fs = require('fs');
let createSVG= require("../private/lesfleurs.js");
const { XMLParser, XMLBuilder, XMLValidator } = require("fast-xml-parser");
const {getFlowerXML, rateFlower, persistFlower,printAllFlowers } = require("../private/persistence.js");

router.get("/modeldata", async function (req, res, next) {
  let start = new Date();
  let csv= await printAllFlowers(12, 3, 1, true);

  let ret= new Array();
  let lines= csv.split("\n");
  for(let i= 0; i< lines.length; i++) {
    if(lines[i].length== 0)
      continue;
    let l= new Array();
    let fields= lines[i].split(";");
    for(let f= 2; f< fields.length; f++) {
        l.push(parseFloat(fields[f]));
    }
    ret.push(fields[0]);
    ret.push(parseFloat(fields[1]));
    ret.push(l);
  }
  res.send(JSON.stringify(ret));
});

router.get("/model", async function (req, res, next) {
  let start = new Date();
  
  let code=req.query.code;
  if(code!= process.env.CODE) {
    res.render("error",{message: "Invalid Code.", error:"Invalid Code.", title: process.env.TITLE});
    global.logger.log("error", "Code invalid: "+code);
    return;   
  }
  res.render("model");

  global.httpRequestDurationMilliseconds
  .labels(req.route.path, res.statusCode, req.method)
  .observe(new Date() - start);
})

router.get("/all/flowers", async function (req, res, next) {
  let start = new Date();
  
  if(process.env.ENV!= "TEST") {
    res.render("error",{message: "Functionality not available.", error:"n/a", title: process.env.TITLE});
    global.logger.log("error", "Functionailty not available");
    return;   
  }
  let code=req.query.code;
  if(code!= process.env.CODE) {
    res.render("error",{message: "Invalid Code.", error:"Invalid Code.", title: process.env.TITLE});
    global.logger.log("error", "Code invalid: "+code);
    return;   
  }
  let normalized= req.query.normalized;
  if(normalized== undefined)
    normalized= false;
  let csv= await printAllFlowers(12, 3, 1, normalized);
  res.attachment('flowers.csv').send(csv);
  global.httpRequestDurationMilliseconds
  .labels(req.route.path, res.statusCode, req.method)
  .observe(new Date() - start);
});


router.get("/flower", async function (req, res, next) {
  let start = new Date();
  
  let id= req.query.flowerId || req.query.flowerid || req.query.id;
  let flower= await getFlowerXML(3, id);
  if(flower.rating== null)
    flower.rating= 0;
  flower.xml= flower.xml.replaceAll("'", "\"");
  let action= 'document.getElementById("menu").style.display="none";'+"svg=`"+flower.xml+"`; showExisting(svg, "+flower.rating+", '"+id+"')";
  res.render("lesfleurs", { code: process.env.CODE, flowerid: id, action: action, contentbackgroundcolor: process.env.CONTENTBACKGROUNDCOLOR, text_color: process.env.TEXT_COLOR, title: process.env.TITLE });

  global.httpRequestDurationMilliseconds
  .labels(req.route.path, res.statusCode, req.method)
  .observe(new Date() - start);
});

router.get("/a/flower", function (req, res, next) {
    let start = new Date();
  
    let code=req.query.code;
    global.logger.log("info", "Getting a flower with code: "+code);
 
    withcolor= Math.random()<0.5?true:false;

    if(code!= process.env.CODE) {
        res.render("error",{message: "Invalid Code.", error:"Invalid Code.", title: process.env.TITLE});
        global.logger.log("error", "Code invalid: "+code);
        return;   
    }
    let svg= createSVG(); 
    svg = svg.replace("</desc>", ' stars=' + (0) + "</desc>");
	
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
    const options = {
      ignoreAttributes: false,
      attributeNamePrefix: ""
    };
    const parser = new XMLParser(options);
    let jobj = parser.parse(svg);
    
    persistFlower(jobj, svg, "app@lesfleurs.theblackapp.de");
      global.httpRequestDurationMilliseconds
      .labels(req.route.path, res.statusCode, req.method)
      .observe(new Date() - start);
  });


module.exports = router;
