---
layout: page
title: Inhomogeneous waves
lesson_number: 40
thumbnail: /assets/images/InhomWaveEquation.PNG
extract: Waves in an inhomogeneous medium
equation: $\pdd{u}{t}= \vnabla\cdot(f(x,y)\vnabla u) $
---
We now consider an inhomogeneous [wave equation](https://en.wikipedia.org/wiki/Heat_equation),

$$\pdd{u}{t}=\vnabla\cdot(f(x,y)\vnabla u),$$

with homogeneous Neumann (aka no-flux) boundary conditions. This equation can be solved numerically as long as $f(x,y)>0$ for all $x,y$ in the domain.

* Load the [interactive simulation](/sim/?preset=inhomogWaveEquation), which uses the example

    $$f(x,y) = D(1+E\sin(m\pi x/L))(1+E\sin(n\pi y/L)).$$

    Importantly, we need $\lvert E\rvert<1$ to ensure the solution makes sense.

* You can change the values of $m$ and $n$ to observe different patterns of regions where waves propagate at different speeds. In particular, using the the function $f(x,y)$ above will lead to corners inside of the domain with very slow wave speeds, and these will become visually apparent quickly.

* Unlike in the [homogeneous case](/basic-pdes/wave-equation), we by default plot $u$ here, but you can change this to $v$ using the menu at the right side labelled **Rendering**.

### Damped waves and inhomogeneous boundaries

We next consider the damped wave equation,


$$\pdd{u}{t} +d\pd{u}{t}=D\nabla^2 u,$$

with inhomogeneous Dirichlet boundary conditions,

$$u|_{\partial \Omega} = \cos(m x \pi/100)\cos(m y \pi/100).$$

An undamped version of this equation ($d=0$) is given [here](/sim/?preset=dampedWaveEquation). You can vary the frequency $m$, or increase the damping $d$ to, for example, $d=0.01$ to observe how this changes the wave propagation into the domain from the boundaries.
