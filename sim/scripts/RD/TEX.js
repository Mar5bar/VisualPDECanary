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

export function getDefaultTeXLabelsDiffusion() {
  let TeXStrings = {};
  // Strings for diffusion coefficients.
  TeXStrings["D"] = "$D$";
  TeXStrings["Du"] = "$D_{u}$";
  TeXStrings["Dv"] = "$D_{v}$";
  TeXStrings["Dw"] = "$D_{w}$";
  TeXStrings["Dq"] = "$D_{q}$";
  TeXStrings["Duu"] = "$D_{u u}$";
  TeXStrings["Duv"] = "$D_{u v}$";
  TeXStrings["Duw"] = "$D_{u w}$";
  TeXStrings["Duq"] = "$D_{u q}$";
  TeXStrings["Dvu"] = "$D_{v u}$";
  TeXStrings["Dvv"] = "$D_{v v}$";
  TeXStrings["Dvw"] = "$D_{v w}$";
  TeXStrings["Dvq"] = "$D_{v q}$";
  TeXStrings["Dwu"] = "$D_{w u}$";
  TeXStrings["Dwv"] = "$D_{w v}$";
  TeXStrings["Dww"] = "$D_{w w}$";
  TeXStrings["Dwq"] = "$D_{w q}$";
  TeXStrings["Dqu"] = "$D_{q u}$";
  TeXStrings["Dqv"] = "$D_{q v}$";
  TeXStrings["Dqw"] = "$D_{q w}$";
  TeXStrings["Dqq"] = "$D_{q q}$";

  return TeXStrings;
}

export function getDefaultTeXLabelsReaction() {
  let TeXStrings = {};
  // Strings for reactions.
  TeXStrings["f"] = "$f$";
  TeXStrings["g"] = "$g$";
  TeXStrings["h"] = "$h$";
  TeXStrings["j"] = "$j$";

  return TeXStrings;
}

export function getDefaultTeXLabelsBCsICs() {
  let TeXStrings = {};
  // Strings for BCs and ICs controllers.
  TeXStrings["u"] = "$u$";
  TeXStrings["v"] = "$v$";
  TeXStrings["w"] = "$w$";
  TeXStrings["q"] = "$q$";
  TeXStrings["uInit"] = "$\\left. u \\right\\rvert_{t=0}$";
  TeXStrings["vInit"] = "$\\left. v \\right\\rvert_{t=0}$";
  TeXStrings["wInit"] = "$\\left. w \\right\\rvert_{t=0}$";
  TeXStrings["qInit"] = "$\\left. q \\right\\rvert_{t=0}$";
  TeXStrings["uD"] = "$\\left. u \\right\\rvert_{\\boundary}$";
  TeXStrings["vD"] = "$\\left. v \\right\\rvert_{\\boundary}$";
  TeXStrings["wD"] = "$\\left. w \\right\\rvert_{\\boundary}$";
  TeXStrings["qD"] = "$\\left. q \\right\\rvert_{\\boundary}$";
  TeXStrings["uN"] = "$\\left.\\pd{u}{n}\\right\\rvert_{\\boundary}$";
  TeXStrings["vN"] = "$\\left.\\pd{v}{n}\\right\\rvert_{\\boundary}$";
  TeXStrings["wN"] = "$\\left.\\pd{w}{n}\\right\\rvert_{\\boundary}$";
  TeXStrings["qN"] = "$\\left.\\pd{q}{n}\\right\\rvert_{\\boundary}$";

  return TeXStrings;
}

export function substituteGreek(str) {
  let listOfVar = ["epsilon"];
  let listOfGreek = [
    "alpha",
    "beta",
    "gamma",
    "delta",
    "varepsilon",
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
    "varphi",
    "varpi",
    "varsigma",
    "vartheta",
    "varkappa",
    "varrho"
  ];
  let regex = new RegExp("\\b(" + listOfVar.join("|") + ")(\\b|_)", "ig");
  str = str.replaceAll(regex, "var" + "$1$2");
  regex = new RegExp("\\b(" + listOfGreek.join("|") + ")(\\b|_)", "ig");
  return str.replaceAll(regex, "\\" + "$1$2");
}
