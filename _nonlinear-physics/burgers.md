---
layout: page
title: Viscous Burgers' equation
lesson_number: 60
thumbnail: /assets/images/BurgersEquation.png
extract: Nonlinear waves
equation: $\pd{u}{t} =-u\pd{u}{x}+\varepsilon \pdd{u}{x}$
---

(Viscous) [Burgers' equation](https://en.wikipedia.org/wiki/Burgers%27_equation):

$$\pd{u}{t} =-u\pd{u}{x}+\varepsilon \pdd{u}{x}.$$

* Load the [interactive simulation](/sim/?preset=BurgersEquation). Locally in space, the wave is translating to the right with a speed $u$, and hence larger initial amplitudes have greater speed.

* In the limit of $\varepsilon \to 0$, the solution forms discontinuous shock solutions. These can be approximated with small $\varepsilon$ (as these solutions will be smooth), though advection will cause numerical difficulties (e.g. oscillations near the front of the wave). Nonzero $\varepsilon$ leads to some loss of amplitude/height of the wave, but otherwise roughly captures the limiting shock behaviour as long as it is sufficiently small.
