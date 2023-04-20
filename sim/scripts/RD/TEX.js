export function equationTEXFun() {
  let out = [];
  out[0] = `$\\begin{aligned}
    \\textstyle \\pd{u}{t} &= \\vnabla \\cdot(D \\vnabla u) + f
    \\end{aligned}$`;
  out[1] = `$\\begin{aligned}
    \\textstyle \\pd{u}{t} &= \\vnabla \\cdot(D_u \\vnabla u) + f\\\\
    \\textstyle \\pd{v}{t} &= \\vnabla \\cdot(D_v \\vnabla v) + g
    \\end{aligned}$`;
  out[2] = `$\\begin{aligned}
    \\textstyle \\pd{u}{t} &= \\vnabla \\cdot (D_{uu} \\vnabla u+D_{uv} \\vnabla v ) + f\\\\
    \\textstyle \\pd{v}{t} &= \\vnabla \\cdot (D_{vu} \\vnabla u+D_{vv} \\vnabla v ) + g
    \\end{aligned}$`;
  out[3] = `$\\begin{aligned}
    \\textstyle \\pd{u}{t} &= \\vnabla \\cdot (D_{uu} \\vnabla u+D_{uv} \\vnabla v ) + f\\\\
    v &= \\vnabla \\cdot (D_{vu} \\vnabla u) + g
    \\end{aligned}$`;
  out[4] = `$\\begin{aligned}
    \\textstyle \\pd{u}{t} &= \\vnabla \\cdot(D_u \\vnabla u) + f\\\\
    \\textstyle \\pd{v}{t} &= \\vnabla \\cdot(D_v \\vnabla v) + g\\\\
    \\textstyle \\pd{w}{t} &= \\vnabla \\cdot(D_w \\vnabla w) + h
    \\end{aligned}$`;
  out[5] = `$\\begin{aligned}
    \\textstyle \\pd{u}{t} &= \\vnabla \\cdot(D_{uu} \\vnabla u+D_{uv} \\vnabla v+D_{uw} \\vnabla w) + f\\\\
    \\textstyle \\pd{v}{t} &= \\vnabla \\cdot(D_{vu} \\vnabla u+D_{vv} \\vnabla v+D_{vw} \\vnabla w) + g\\\\
    \\textstyle \\pd{w}{t} &= \\vnabla \\cdot(D_{wu} \\vnabla u+D_{wv} \\vnabla v+D_{ww} \\vnabla w) + h
    \\end{aligned}$`;
  out[6] = `$\\begin{aligned}
    \\textstyle \\pd{u}{t} &= \\vnabla \\cdot(D_{uu} \\vnabla u+D_{uv} \\vnabla v+D_{uw} \\vnabla w) + f\\\\
    \\textstyle \\pd{v}{t} &= \\vnabla \\cdot(D_{vu} \\vnabla u+D_{vv} \\vnabla v+D_{vw} \\vnabla w) + g\\\\
    w &= \\vnabla \\cdot(D_{wu} \\vnabla u+D_{wv} \\vnabla v) + h
    \\end{aligned}$`;
  out[7] = `$\\begin{aligned}
    \\textstyle \\pd{u}{t} &= \\vnabla \\cdot(D_u \\vnabla u) + f\\\\
    \\textstyle \\pd{v}{t} &= \\vnabla \\cdot(D_v \\vnabla v) + g\\\\
    \\textstyle \\pd{w}{t} &= \\vnabla \\cdot(D_w \\vnabla w) + h\\\\
    \\textstyle \\pd{q}{t} &= \\vnabla \\cdot(D_q \\vnabla q) + j
    \\end{aligned}$`;
  out[8] = `$\\begin{aligned}
    \\textstyle \\pd{u}{t} &= \\vnabla \\cdot(D_{uu} \\vnabla u+D_{uv} \\vnabla v+D_{uw} \\vnabla w+D_{uq} \\vnabla q) + f\\\\
    \\textstyle \\pd{v}{t} &= \\vnabla \\cdot(D_{vu} \\vnabla u+D_{vv} \\vnabla v+D_{vw} \\vnabla w+D_{vq} \\vnabla q) + g\\\\
    \\textstyle \\pd{w}{t} &= \\vnabla \\cdot(D_{wu} \\vnabla u+D_{wv} \\vnabla v+D_{ww} \\vnabla w+D_{wq} \\vnabla q) + h\\\\
    \\textstyle \\pd{q}{t} &= \\vnabla \\cdot(D_{qu} \\vnabla u+D_{qv} \\vnabla v+D_{qw} \\vnabla w+D_{qq} \\vnabla q) + j
    \\end{aligned}$`;
  out[9] = `$\\begin{aligned}
    \\textstyle \\pd{u}{t} &= \\vnabla \\cdot(D_{uu} \\vnabla u+D_{uv} \\vnabla v+D_{uw} \\vnabla w+D_{uq} \\vnabla q) + f\\\\
    \\textstyle \\pd{v}{t} &= \\vnabla \\cdot(D_{vu} \\vnabla u+D_{vv} \\vnabla v+D_{vw} \\vnabla w+D_{vq} \\vnabla q) + g\\\\
    w &= \\vnabla \\cdot(D_{wu} \\vnabla u+D_{wv} \\vnabla v+D_{wq} \\vnabla q) + h\\\\
    \\textstyle \\pd{q}{t} &= \\vnabla \\cdot(D_{qu} \\vnabla u+D_{qv} \\vnabla v+D_{qw} \\vnabla w+D_{qq} \\vnabla q) + j
    \\end{aligned}$`;
  out[10] = `$\\begin{aligned}
    \\textstyle \\pd{u}{t} &= \\vnabla \\cdot(D_{uu} \\vnabla u+D_{uv} \\vnabla v+D_{uw} \\vnabla w+D_{uq} \\vnabla q) + f\\\\
    \\textstyle \\pd{v}{t} &= \\vnabla \\cdot(D_{vu} \\vnabla u+D_{vv} \\vnabla v+D_{vw} \\vnabla w+D_{vq} \\vnabla q) + g\\\\
    \\textstyle \\pd{w}{t} &= \\vnabla \\cdot(D_{wu} \\vnabla u+D_{wv} \\vnabla v+D_{ww} \\vnabla w+D_{wq} \\vnabla q) + h\\\\
    q &= \\vnabla \\cdot(D_{qu} \\vnabla u+D_{qv} \\vnabla v+D_{qw} \\vnabla w) + j
    \\end{aligned}$`;
  out[11] = `$\\begin{aligned}
    \\textstyle \\pd{u}{t} &= \\vnabla \\cdot(D_{uu} \\vnabla u+D_{uv} \\vnabla v+D_{uw} \\vnabla w+D_{uq} \\vnabla q) + f\\\\
    \\textstyle \\pd{v}{t} &= \\vnabla \\cdot(D_{vu} \\vnabla u+D_{vv} \\vnabla v+D_{vw} \\vnabla w+D_{vq} \\vnabla q) + g\\\\
    w &= \\vnabla \\cdot(D_{wu} \\vnabla u+D_{wv} \\vnabla v+D_{wq} \\vnabla q) + h\\\\
    q &= \\vnabla \\cdot(D_{qu} \\vnabla u+D_{qv} \\vnabla v+D_{qw} \\vnabla w) + j
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
