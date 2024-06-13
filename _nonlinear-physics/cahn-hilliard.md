---
layout: page
title: Cahn–Hilliard equation
lesson_number: 30
thumbnail: /assets/images/CahnHilliard.webp
extract: Phase separation
equation: $\pd{u}{t}=\nabla^2 (F(u)-g\nabla^2u)+f(u)$
---

We now study the [Cahn–Hilliard equation](https://en.wikipedia.org/wiki/Cahn%E2%80%93Hilliard_equation) with an extra reaction term,

$$\pd{u}{t} = r\nabla^2 (u^3-u-g\nabla^2u)+u-u^3,$$

with periodic boundary conditions.

- Load the [interactive simulation](/sim/?preset=CahnHilliard)

- The initial condition is taken to be random noise at the level of the discretised system, and the initial timescale, given by $r$, is small. Increase $r$ by one or two orders of magnitude to speed up the simulation, and observe the coarsening process as described in this [2001 article](https://people.maths.ox.ac.uk/trefethen/pdectb/cahn2.pdf).

There are lots of things that you can do with this equation (with or without the reaction term). For instance, you can extend it to a 'non-reciprocal' Cahn–Hilliard system as in [Brauns and Marchetti](https://doi.org/10.1103/PhysRevX.14.021014), which exhibits pretty patterns that you can play with in this [interactive simulation](/sim/?preset=CahnHilliardNonreciprocal). Thanks to Lloyd Fung for pointing out this example!

