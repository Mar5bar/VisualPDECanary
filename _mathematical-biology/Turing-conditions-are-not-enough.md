---
layout: page
title: "Turing conditions are not enough"
lesson_number: 140
thumbnail: /assets/images/TuringNotEnough.webp.webp
extract: Beyond the limits of linear theory
---

Linear stability theory is often used to predict regions of pattern-forming (or 'Turing') instabilities. However, in the presence of multiple homogeneous equilibria, these instabilities do not guarantee that a system develops a pattern. Here, we implement interactive versions of three local models in the paper "Turing conditions are not enough to ensure pattern formation" by Andrew L. Krause, Eamonn A. Gaffney, Thomas Jun Jewell, Václav Klika, and Benjamin J. Walker. 

In each case, the default is a 2D spatial domain with periodic boundary conditions. The boundary conditions can be modified by clicking {{ layout.equations }} → **Boundary conditions**, and the domain can be changed to a 1D interval by clicking {{ layout.settings }} → **Domain** and setting the dimension to be 1.

### Reaction--diffusion system
[This simulation](/sim/?preset=TuringNotEnoughRD) explores the reaction--diffusion system

$$
\begin{aligned}
\pd{u}{t}&=\nabla^2 u+u-v-eu^3,\\ \pd{v}{t}&=D\nabla^2 v+ a v(v + c)(v - d) +  b u - e v^3.
\end{aligned}
$$

### Keller--Segel chemotaxis
[This simulation](/sim/?preset=TuringNotEnoughKellerSegel) corresponds to the equations

$$
\begin{aligned}\pd{u}{t} &=  \nabla^2 u - c\vnabla \cdot(u\vnabla v) +u(b - u)(u - d),\\
\pd{v}{t} &= D \nabla^2 v + u-av.
\end{aligned}
$$

### Biharmonic equation
[This simulation](/sim/?preset=TuringNotEnoughBiharmonic) corresponds to the equation

$$
\pd{u}{t} = - D\nabla^2 u -  \nabla^4 u + au(c - u)(u - b).
$$
