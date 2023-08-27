---
layout: page
title: "Turing conditions are not enough"
lesson_number: 140
thumbnail: /assets/images/TuringNotEnough.webp
extract: Beyond the limits of linear theory
---

Linear stability theory is often used to predict regions of pattern-forming (or 'Turing') instabilities. However, in the presence of multiple homogeneous equilibria, these instabilities do not guarantee that a system develops a pattern. Here, we implement interactive versions of three local models in the paper "Turing conditions are not enough to ensure pattern formation" by Andrew L. Krause, Eamonn A. Gaffney, Thomas Jun Jewell, Václav Klika, and Benjamin J. Walker. 

In each case, the default is a 2D spatial domain with periodic boundary conditions. The boundary conditions can be modified by clicking {{ layout.equations }} → **Boundary conditions**, and the domain can be changed to a 1D interval by clicking {{ layout.settings }} → **Domain** and setting the dimension to be 1. By default an initial small random perturbation of a homogeneous equilibrium is used to generate a Turing instability which eventually leads to the solution approaching a different homogeneous equilibrium. You can alternatively click to introduce a localised perturbation, or directly input a different initial condition. Importantly all parameters and functional forms can also be changed. Below we highlight specific parameters that give different dynamics.

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

Localised solutions can be found by setting $c=5$ and $d=0.1$. Reducing $d$ further to $0.01$ for this value of $c=5$ leads to spatiotemporal behaviour similar to using the purely logistic demographi term as in [this Keller-Segel simulation](/mathematical-biology/keller-segel).

### Biharmonic equation
[This simulation](/sim/?preset=TuringNotEnoughBiharmonic) corresponds to the equation

$$
\pd{u}{t} = - D\nabla^2 u -  \nabla^4 u + au(c - u)(u - b).
$$

Setting the value of $D=1.87$ will instead lead to localised states which are near the boundary of stability. These will decay slowly for $D\leq 1.85$ but appear to remain stable for this value of $D$.
