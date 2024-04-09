---
layout: demo
lesson_number: 120
title: Stripes in the Gierer–Meinhardt model
thumbnail: /assets/images/GiererMeinhardt.webp
sim: "/sim/?preset=GiererMeinhardtStripes&story&nomathjax&sf=1&no_ui"
---


<div>
    <h1>Stripes in the Gierer–Meinhardt model</h1>
    <h3>Click to perturb the steady state of</h3>
    <p>$$\begin{aligned}\pd{u}{t}&=\nabla^2 u+a+\frac{u^2}{v}-bu,\\ \pd{v}{t}&=D\nabla^2v+ u^2-cv,\end{aligned}$$
    where we take $a,b,c>0$ and $D>1$.</p>
    <p><vpde-reset iframe="sim"></vpde-reset></p>
</div>
<p style="text-align:center;margin-top:0;"><vpde-slider
    iframe="sim"
    name="K"
    label="$K$"
    min="0"
    max="0.003"
    value="0.001"
    step="0.0001"
    min-label="Zero"
    max-label="Max"
></vpde-slider></p>
