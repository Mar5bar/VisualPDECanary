export function equationTEXFun() {
  let out = [];
  out[0] = `$\\begin{aligned}
    \\textstyle \\pd{u}{t} &= \\vnabla \\cdot(D \\vnabla u) + f
    \\end{aligned}$`;
  out[1] = `$\\begin{aligned}
    \\textstyle \\pd{u}{t} &= \\vnabla \\cdot(D_{u} \\vnabla u) + f\\\\
    \\textstyle \\pd{v}{t} &= \\vnabla \\cdot(D_{v} \\vnabla v) + g
    \\end{aligned}$`;
  out[2] = `$\\begin{aligned}
    \\textstyle \\pd{u}{t} &= \\vnabla \\cdot (D_{u u} \\vnabla u+D_{u v} \\vnabla v ) + f\\\\
    \\textstyle \\pd{v}{t} &= \\vnabla \\cdot (D_{v u} \\vnabla u+D_{v v} \\vnabla v ) + g
    \\end{aligned}$`;
  out[3] = `$\\begin{aligned}
    \\textstyle \\pd{u}{t} &= \\vnabla \\cdot (D_{u u} \\vnabla u+D_{u v} \\vnabla v ) + f\\\\
    v &= \\vnabla \\cdot (D_{v u} \\vnabla u) + g
    \\end{aligned}$`;
  out[4] = `$\\begin{aligned}
    \\textstyle \\pd{u}{t} &= \\vnabla \\cdot(D_{u} \\vnabla u) + f\\\\
    \\textstyle \\pd{v}{t} &= \\vnabla \\cdot(D_{v} \\vnabla v) + g\\\\
    \\textstyle \\pd{w}{t} &= \\vnabla \\cdot(D_{w} \\vnabla w) + h
    \\end{aligned}$`;
  out[5] = `$\\begin{aligned}
    \\textstyle \\pd{u}{t} &= \\vnabla \\cdot(D_{u u} \\vnabla u+D_{u v} \\vnabla v+D_{u w} \\vnabla w) + f\\\\
    \\textstyle \\pd{v}{t} &= \\vnabla \\cdot(D_{v u} \\vnabla u+D_{v v} \\vnabla v+D_{v w} \\vnabla w) + g\\\\
    \\textstyle \\pd{w}{t} &= \\vnabla \\cdot(D_{w u} \\vnabla u+D_{w v} \\vnabla v+D_{w w} \\vnabla w) + h
    \\end{aligned}$`;
  out[6] = `$\\begin{aligned}
    \\textstyle \\pd{u}{t} &= \\vnabla \\cdot(D_{u u} \\vnabla u+D_{u v} \\vnabla v+D_{u w} \\vnabla w) + f\\\\
    \\textstyle \\pd{v}{t} &= \\vnabla \\cdot(D_{v u} \\vnabla u+D_{v v} \\vnabla v+D_{v w} \\vnabla w) + g\\\\
    w &= \\vnabla \\cdot(D_{w u} \\vnabla u+D_{w v} \\vnabla v) + h
    \\end{aligned}$`;
  out[7] = `$\\begin{aligned}
    \\textstyle \\pd{u}{t} &= \\vnabla \\cdot(D_{u} \\vnabla u) + f\\\\
    \\textstyle \\pd{v}{t} &= \\vnabla \\cdot(D_{v} \\vnabla v) + g\\\\
    \\textstyle \\pd{w}{t} &= \\vnabla \\cdot(D_{w} \\vnabla w) + h\\\\
    \\textstyle \\pd{q}{t} &= \\vnabla \\cdot(D_{q} \\vnabla q) + j
    \\end{aligned}$`;
  out[8] = `$\\begin{aligned}
    \\textstyle \\pd{u}{t} &= \\vnabla \\cdot(D_{u u} \\vnabla u+D_{u v} \\vnabla v+D_{u w} \\vnabla w+D_{u q} \\vnabla q) + f\\\\
    \\textstyle \\pd{v}{t} &= \\vnabla \\cdot(D_{v u} \\vnabla u+D_{v v} \\vnabla v+D_{v w} \\vnabla w+D_{v q} \\vnabla q) + g\\\\
    \\textstyle \\pd{w}{t} &= \\vnabla \\cdot(D_{w u} \\vnabla u+D_{w v} \\vnabla v+D_{w w} \\vnabla w+D_{w q} \\vnabla q) + h\\\\
    \\textstyle \\pd{q}{t} &= \\vnabla \\cdot(D_{q u} \\vnabla u+D_{q v} \\vnabla v+D_{q w} \\vnabla w+D_{q q} \\vnabla q) + j
    \\end{aligned}$`;
  out[9] = `$\\begin{aligned}
    \\textstyle \\pd{u}{t} &= \\vnabla \\cdot(D_{u u} \\vnabla u+D_{u v} \\vnabla v+D_{u w} \\vnabla w+D_{u q} \\vnabla q) + f\\\\
    \\textstyle \\pd{v}{t} &= \\vnabla \\cdot(D_{v u} \\vnabla u+D_{v v} \\vnabla v+D_{v w} \\vnabla w+D_{v q} \\vnabla q) + g\\\\
    w &= \\vnabla \\cdot(D_{w u} \\vnabla u+D_{w v} \\vnabla v+D_{w q} \\vnabla q) + h\\\\
    \\textstyle \\pd{q}{t} &= \\vnabla \\cdot(D_{q u} \\vnabla u+D_{q v} \\vnabla v+D_{q w} \\vnabla w+D_{q q} \\vnabla q) + j
    \\end{aligned}$`;
  out[10] = `$\\begin{aligned}
    \\textstyle \\pd{u}{t} &= \\vnabla \\cdot(D_{u u} \\vnabla u+D_{u v} \\vnabla v+D_{u w} \\vnabla w+D_{u q} \\vnabla q) + f\\\\
    \\textstyle \\pd{v}{t} &= \\vnabla \\cdot(D_{v u} \\vnabla u+D_{v v} \\vnabla v+D_{v w} \\vnabla w+D_{v q} \\vnabla q) + g\\\\
    \\textstyle \\pd{w}{t} &= \\vnabla \\cdot(D_{w u} \\vnabla u+D_{w v} \\vnabla v+D_{w w} \\vnabla w+D_{w q} \\vnabla q) + h\\\\
    q &= \\vnabla \\cdot(D_{q u} \\vnabla u+D_{q v} \\vnabla v+D_{q w} \\vnabla w) + j
    \\end{aligned}$`;
  out[11] = `$\\begin{aligned}
    \\textstyle \\pd{u}{t} &= \\vnabla \\cdot(D_{u u} \\vnabla u+D_{u v} \\vnabla v+D_{u w} \\vnabla w+D_{u q} \\vnabla q) + f\\\\
    \\textstyle \\pd{v}{t} &= \\vnabla \\cdot(D_{v u} \\vnabla u+D_{v v} \\vnabla v+D_{v w} \\vnabla w+D_{v q} \\vnabla q) + g\\\\
    w &= \\vnabla \\cdot(D_{w u} \\vnabla u+D_{w v} \\vnabla v+D_{w q} \\vnabla q) + h\\\\
    q &= \\vnabla \\cdot(D_{q u} \\vnabla u+D_{q v} \\vnabla v+D_{q w} \\vnabla w) + j
    \\end{aligned}$`;
  return out;
}

export function substituteGreek(str) {
  let listOfGreek = [
    "alpha",
    "beta",
    "gamma",
    "delta",
    "epsilon",
    "zeta",
    "eta",
    "theta",
    "iota",
    "kappa",
    "lambda",
    "mu",
    "nu",
    "xi",
    "pi",
    "rho",
    "sigma",
    "tau",
    "upsilon",
    "phi",
    "chi",
    "psi",
    "omega",
  ];
  let regex = new RegExp("\\b(" + listOfGreek.join("|") + ")(\\b|_)", "ig");
  return str.replaceAll(regex, "\\" + "$1$2");
}
