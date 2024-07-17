---
layout: page
title: Keller–Segel chemotaxis
lesson_number: 90
thumbnail: /assets/images/KellerSegel.webp
extract: Slime moulds and cell movement
equation: $\pd{u}{t}=\nabla^2 u-\vnabla \cdot(\chi(u)\vnabla v)+f_u(u),$ $\pd{v}{t}=D\nabla^2v+ f_v(u,v)$
categories: [biology, patterns, chaos, parabolic]
---
We now consider [Keller–Segel models of chemotaxis](https://en.wikipedia.org/wiki/Chemotaxis#Mathematical_models) of the form

$$\begin{aligned}\pd{u}{t}&=\nabla^2 u-\vnabla \cdot(\chi(u)\vnabla v)+f_u(u),\\ \pd{v}{t}&=D\nabla^2v+ f_v(u,v),\end{aligned}$$

where we take

$$\begin{aligned}\chi&=\displaystyle\frac{cu}{1+u^2},\\f_u(u)&=u(1-u),\\f_v(u,v) &= u-av.\end{aligned}$$

* Load the [interactive simulation](/sim/?preset=KellerSegel)

* The initial condition condition is a small random initial population, which eventually grows towards the homogeneous equilibrium of $u=1$, $v=1/a$, but will undergo pattern formation as it nears this equilibrium.

* Try changing the values of $D$, $c$, and $a$ and then pressing {{ layout.restart }} to restart the simulation. Importantly, this system will have some hysteresis in that patterns may appear differently depending on where they evolved from, and when you change the parameters (for example, if you restart the simulation or just change the parameters and let it evolve from one state to another). The colour bars are fixed so that taking $c=10$ leads to patterns which saturate the colour scale.

* Linear instability analysis predicts a pattern-forming instability for parameters satisfying

    $$2\sqrt{aD} < \frac{c}{2}-D-a.$$

    Test this inequality by varying parameters (for example, around $c = 3.3$ to $c=3.6$), leaving the other parameters as they are.
