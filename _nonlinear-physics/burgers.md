---
layout: page
title: Burgers' equation
lesson_number: 60
thumbnail: /assets/images/BurgersEquation.webp
extract: Nonlinear waves
equation: $\pd{u}{t} =-u\pd{u}{x}+\varepsilon \pdd{u}{x}$
categories: [waves, parabolic]
---

(Viscous) [Burgers' equation](https://en.wikipedia.org/wiki/Burgers%27_equation):

$$\pd{u}{t} =-u\pd{u}{x}+\varepsilon \pdd{u}{x}.$$

* Load the [interactive simulation](/sim/?preset=BurgersEquation). Locally in space, the wave is translating to the right with a speed $u$, and hence larger initial amplitudes have greater speed.

* In the limit of $\varepsilon \to 0$, the solution forms discontinuous shock solutions. These can be approximated with small $\varepsilon$ (as these solutions will be smooth), though advection will cause numerical difficulties (e.g. oscillations near the front of the wave). Nonzero $\varepsilon$ leads to some loss of amplitude/height of the wave, but otherwise roughly captures the limiting shock behaviour as long as it is sufficiently small.

* A more careful implementation of the fully inviscid case allows us to see shock formation. Explore this in [this interactive inviscid shock simulation](/sim/?preset=InviscidBurgers). You can also click to introduce different initial conditions, or check out [this simulation of shock wave interaction](/sim/?preset=InviscidBurgersShockInteraction), where shocks of different profiles overtake each other due to different maximal speeds.