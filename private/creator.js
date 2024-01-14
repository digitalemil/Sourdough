
function getName() {
    var minm = 10000000000; 
    var maxm = 99999999999; 
    let n = Math.floor(Math 
    .random() * (maxm - minm + 1)) + minm; 
    return "Ticket"+n;
}

function getOrigin() {
    let origin="EMEA";
    if(Math.random()< 0.66) {
        if(Math.random()< 0.33) {
            origin="AMERICAS";
        }
        else {
            origin="APAC";
        }
    }
    return origin;
}

function createSVG() {
    let name= getName();
    let desc= "name=\""+getName()+"\" origin=\""+getOrigin()+"\"";
    let ret = `<svg style="background-color: #FFFFF0" width="1024" height="1024"  xmlns="http://www.w3.org/2000/svg">
    <desc>`+ desc + `</desc>`+"\n"

    ret+=`
    <style>
    .small {
      font: italic 13px sans-serif;
    }
    .heavy {
      font: bold 30px sans-serif;
    }

    /* Note that the color of the text is set with the    *
     * fill property, the color property is for HTML only */
    .big {
      font: italic 40px serif;
      fill: black;
    }
    </style>
    <text x="16" y="64" class="big">`+getName()+`</text>
    `

    ret+= "</svg>";

    return ret;
}

module.exports = createSVG;
