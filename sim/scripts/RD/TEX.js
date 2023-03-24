export function equationTEXFun() {
  let out = [];
  out[0] = `$\\begin{aligned}
    \\pd{u}{t} &= \\vnabla \\cdot(D\\vnabla u) + f
    \\end{aligned}$`;
  out[1] = `$\\begin{aligned}
    \\textstyle \\pd{u}{t} &= \\vnabla \\cdot(D_u\\vnabla u) + f\\\\
    \\textstyle \\pd{v}{t} &= \\vnabla \\cdot(D_v\\vnabla v) + g
    \\end{aligned}$`;
  out[2] = `$\\begin{aligned}
    \\textstyle \\pd{u}{t} &= \\vnabla \\cdot (D_{uu}\\vnabla u+D_{uv}\\vnabla v ) + f\\\\
    \\textstyle \\pd{v}{t} &= \\vnabla \\cdot (D_{vu}\\vnabla u+D_{vv}\\vnabla v ) + g
    \\end{aligned}$`;
  out[3] = `$\\begin{aligned}
    \\textstyle \\pd{u}{t} &= \\vnabla \\cdot (D_{uu}\\vnabla u+D_{uv}\\vnabla v ) + f\\\\
    v &= \\vnabla \\cdot (D_{vu}\\vnabla u) + g
    \\end{aligned}$`;
  out[4] = `$\\begin{aligned}
    \\textstyle \\pd{u}{t} &= \\vnabla \\cdot(D_u\\vnabla u) + f\\\\
    \\textstyle \\pd{v}{t} &= \\vnabla \\cdot(D_v\\vnabla v) + g\\\\
    \\textstyle \\pd{w}{t} &= \\vnabla \\cdot(D_w\\vnabla w) + h
    \\end{aligned}$`;
  out[5] = `$\\begin{aligned}
    \\textstyle \\pd{u}{t} &= \\vnabla \\cdot(D_{uu}\\vnabla u+D_{uv}\\vnabla v+D_{uw}\\vnabla w) + f\\\\
    \\textstyle \\pd{v}{t} &= \\vnabla \\cdot(D_{vu}\\vnabla u+D_{vv}\\vnabla v+D_{vw}\\vnabla w) + g\\\\
    \\textstyle \\pd{w}{t} &= \\vnabla \\cdot(D_{wu}\\vnabla u+D_{wv}\\vnabla v+D_{ww}\\vnabla w) + h
    \\end{aligned}$`;
  out[6] = `$\\begin{aligned}
    \\textstyle \\pd{u}{t} &= \\vnabla \\cdot(D_{uu}\\vnabla u+D_{uv}\\vnabla v+D_{uw}\\vnabla w) + f\\\\
    \\textstyle \\pd{v}{t} &= \\vnabla \\cdot(D_{vu}\\vnabla u+D_{vv}\\vnabla v+D_{vw}\\vnabla w) + g\\\\
    w &= \\vnabla \\cdot(D_{wu}\\vnabla u+D_{wv}\\vnabla v) + h
    \\end{aligned}$`;
    return out;
}
