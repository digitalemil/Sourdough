
function translatePoint(pt, x, y) {
    pt.x += x;
    pt.y += y;
};

function rnd(x) {
    return Math.round(x);
};

function ran(start, delta) {
    let res = start - delta / 2 + Math.random() * delta;
    return res;
};

function transform(o) {
    if (o.s == undefined)
        o.s = 1.0;
    if (o.x == undefined)
        o.x = 0.0;
    if (o.y == undefined)
        o.y = 0.0;
    if (o.r == undefined)
        o.r = 0;
    return (o.s == 1.0 ? "" : ("scale(" + (o.s) + ")")) + ((o.x == 0 && o.y == 0) ? "" : ("translate(" + rnd(o.x) + "," + rnd(o.y) + ")")) + (o.r == 0.0 ? "" : ("rotate(" + rnd(o.r) + ")"));
}

function createPath(id, c, t, d, withcolor) {
    if(withcolor) {
        return '<path id="' + id + '" transform="' + t + '" style="filter: url(#' + c + ')" d="' + d;
    }
    else {
        return '<path id="' + id + '" transform="' + t + '" fill="#202020" stroke="black" style="opacity: 0.95;" d="' + d;
    }
};

function bezier(c) {
    return "M" + rnd(c[0].x) + " " + rnd(c[0].y) + " C" + rnd(c[2].x) + " " + rnd(c[2].y) + ", " + rnd(c[3].x) + " " + rnd(c[3].y) + ", " + rnd(c[1].x) + " " + rnd(c[1].y)
}

function getCubicBezierDataByID(id, xtra, nleafs, nstems, npetals) {
    if (id >= nleafs && id < nstems + nleafs)
        return getCubicBezierData(0, xtra);
    if (id < nleafs)
        return getCubicBezierData(1, xtra);
    return getCubicBezierData(2, xtra);
}

function getCubicBezierData(type, xtra) {
    let variations = [4, 1, 8, 4, 40, 8];
    let all = new Array();

    all = [
        [[{ x: -32, y: 320 }, { x: 0, y: -320 }, { x: 24, y: -160 }, { x: 116, y: -80 }],
        [{ x: 0, y: -320 }, { x: -32, y: 320 }, { x: 104, y: -80 }, { x: 16, y: -184 }]],
        [[{ x: -64, y: 0 }, { x: 64, y: 0 }, { x: -64, y: -48 }, { x: 32, y: -48 }],
        [{ x: 64, y: 0 }, { x: -64, y: 0 }, { x: 64, y: 48 }, { x: 32, y: 48 }]],
        [[{ x: -72, y: 28 }, { x: 72, y: -28 }, { x: -40, y: -84 }, { x: 72, y: -28 }],
        [{ x: 72, y: -28 }, { x: -72, y: 28 }, { x: 80, y: -64 }, { x: -100, y: -126 }]
        ]];

    let c = all[type];

    for (let i = 2; i < c.length; i++) {
        for (let n = 0; n < 3; n++) {
            translatePoint(c[i][n], 0, xtra);
        }
    }

    let v = variations[type * 2];
    for (let i = 2; i < 4; i++) {
        translatePoint(c[0][i], ran(-v, v), ran(-v, v));
        translatePoint(c[1][i], ran(-v, v), ran(-v, v));
    }
    v = variations[type * 2 + 1];
    variate(c[0][0], c[1][1], v);
    variate(c[0][1], c[1][0], v);

    return c;
}

function createSVG() {
    let nleafs = 3, nstems = 1, npetals = 12;
    let origin="EMEA";
    if(Math.random()< 0.66) {
        if(Math.random()< 0.33) {
            origin="AMERICAS";
        }
        else {
            origin="APAC";
        }
    }
    let desc= "name=''Fleur'' origin=''"+origin+"'' leafs="+nleafs+" stems="+nstems+" npetals="+npetals
    let ret = `<svg style="background-color: #FFFFF0" width="1024" height="1024"  xmlns="http://www.w3.org/2000/svg">
    <desc>`+ desc + `</desc>`+"\n"
    let red = ran(206, 20);
    let green = ran(124, 10);
    let blue = ran(140, 10);
    let alpha = ran(248, 8);
    if(withcolor) {
        ret+= `<filter id="r" color-interpolation-filters="sRGB" x="0%" y="0%" height="100%" width="100%" transform="`+ rnd(ran(-180, 180) * 360) + `deg">
            <feTurbulence type="fractalNoise" result="cb" baseFrequency=".0035" numOctaves="6" seed="16"/>
            <feColorMatrix in="cb" type="hueRotate" values="0" result="cl"/>
            <feColorMatrix in="cl" result="w" type="matrix" values="4 0 0 0 -1 4 0 0 0 -1 4 0 0 0 -1 1 0 0 0 0"/>
            <feFlood flood-color="rgba(`+ red + "," + green + "," + blue + "," + alpha +`)" result="r"/>
            <feBlend mode="screen" in2="r" in="w"/>
            <feGaussianBlur stdDeviation="4"/>
            <feComposite operator="in" in2="SourceGraphic"/>
        </filter>`
        red = ran(40, 20);
        green = ran(160, 80);
        blue = ran(30, 10);
        ret += `<filter id="g" color-interpolation-filters="sRGB" x="0%" y="0%" height="100%" width="100%" transform="`+ rnd(-180, 180) + `deg">
            <feTurbulence type="fractalNoise" result="cb" baseFrequency=".0035" numOctaves="5" seed="15"/>
            <feColorMatrix in="cb" type="hueRotate" values="0" result="cl"/>
            <feColorMatrix in="cl" result="w" type="matrix" values="4 0 0 0 -1 4 0 0 0 -1 4 0 0 0 -1 1 0 0 0 0"/>
            <feFlood flood-color="rgba(`+ red + "," + green + "," + blue + "," + alpha +`)" result="g"/>
            <feBlend mode="screen" in2="g" in="w"/>
            <feComposite operator="in" in2="SourceGraphic"/>
        </filter>`
    }
    ret += '<g transform="translate(512, 600) scale(' + (Math.random() < 0.5 ? 1.0 : -1.0) + ',1)">\n'

    let ids = new Array();
    let colors = new Array();

    let t = [
        { x: -32, y: -64 },
        { r: ran(180, 4), x: 96, y: -48 },
        { s: 0.8, r: ran(160, 4), x: 104, y: -104 },
        {},
        { s: ran(0.15, 0.05), r: ran(0, 120), y: ran(20, 20) },
        { s: ran(0.15, 0.05), r: ran(180, 120), y: ran(-20, 20) },
        { s: ran(0.4, 0.2), r: ran(60, 120), y: ran(12, 12) },
        { s: ran(0.4, 0.2), r: ran(240, 120), y: ran(-12, 12) },
        { s: ran(0.6, 0.2), r: ran(60, 120), y: ran(12, 12) },
        { s: ran(0.6, 0.2), r: ran(240, 120), y: ran(-12, 12) },

        { s: ran(1.0, 0.2), r: ran(0, 60), y: ran(12, 12) },
        { s: ran(1.0, 0.2), r: ran(180, 60), y: ran(-12, 12) },
        { s: ran(1.2, 0.2), r: ran(90, 60), y: ran(-12, 12) },
        { s: ran(1.2, 0.2), r: ran(270, -60), y: ran(12, 12) },
        { s: ran(1.6, 0.2), r: ran(180, 180), y: ran(-12, 12) },
        { s: ran(1.6, 0.2), r: ran(180, 180), y: ran(12, 12) },
    ]
    for (let i = 0; i < nleafs + nstems + npetals; i++) {
        let id = i;
        let p = "l";
        if (i >= nleafs && i < nleafs + nstems) {
            id = i - nleafs;
            p = "s";
        }
        else {
            if (i >= nleafs + nstems) {
                id = i - nleafs - nstems;
                p = "p";
            }
        }
        ids[i] = p + id;
        colors[i] = i < nstems + nleafs ? "g" : "r";
    }

    for (let l = 0; l < ids.length; l++) {
        let d = getCubicBezierDataByID(l, 0, nleafs, nstems, npetals);
        if (l == nstems + nleafs) {
            ret += '<g transform="translate(-32, -340)">\n';
        }
        ret += createPath(ids[l], colors[l], transform(t[l]), bezier(d[0]) + " " + bezier(d[1]), withcolor) + '"/>\n'
    }
    ret += "</g></g></svg>";
    svg = ret;
    return ret;
};

function variate(pt1, pt2, v) {
    let rx = ran(-v, v);
    let ry = ran(-v, v);
    translatePoint(pt1, rx, ry);
    translatePoint(pt2, rx, ry);
};

module.exports = createSVG;
