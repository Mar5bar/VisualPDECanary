---
layout: page
title: Inhomogeneous waves
lesson_number: 40
thumbnail: /assets/images/InhomWaveEquation.PNG
extract: Waves in an inhomogeneous medium
equation: $\pdd{u}{t}= \vnabla\cdot(Df(x,y)\vnabla u) $
---
We now consider an inhomogeneous [wave equation](https://en.wikipedia.org/wiki/Heat_equation),

$$\pdd{u}{t}=\vnabla\cdot(Df(x,y)\vnabla u),$$

with homogeneous Neumann (aka no-flux) boundary conditions. This equation can be solved numerically as long as $f(x,y)>0$ for all $x,y$ in the domain.

* Load the [interactive simulation](/sim/?preset=inhomogWaveEquation) which uses the example $f(x,y) = D(1+E\sin(m\pi x))(1+E\sin(n\pi y))$. Importantly we need $|E|<1$ to ensure the solution makes sense.

* You can change the values of $m$ and $n$ to observe different patterns of regions where waves propagate at different speeds. In particular, using the the function $f(x,y)$ above will lead to corners inside of the domain with very slow wave speeds, and these will become visually apparent quickly.

* Unlike in the [homogeneous case](/basic-pdes/wave-equation), we by default plot $u$ here, but you can change this to $v$ using the menu at the right side called 'Colour'.
