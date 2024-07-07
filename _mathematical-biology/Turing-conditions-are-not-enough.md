---
layout: page
title: "Turing instabilities are not enough"
lesson_number: 140
thumbnail: /assets/images/TuringNotEnough.webp
extract: Beyond the limits of linear theory
categories: [biology, patterns]
---

Linear stability theory is often used to predict regions of pattern-forming (or 'Turing') instabilities. However, in the presence of multiple homogeneous equilibria, these instabilities do not guarantee that a system develops a pattern. 

Here, we implement interactive versions of three local models in the paper "[Turing instabilities are not enough to ensure pattern formation](https://arxiv.org/abs/2308.15311)."

In each case, the default is a 2D spatial domain with periodic boundary conditions. The boundary conditions can be modified by clicking <span class='click_sequence'>{{ layout.equations }} → **Boundary conditions**,</span> and the domain can be changed to a 1D interval by clicking <span class='click_sequence'>{{ layout.settings }} → **Domain**</span> and setting the dimension to be 1. 

By default, an initial small random perturbation of a homogeneous equilibrium is used to generate a Turing instability which eventually leads to the solution approaching a different homogeneous equilibrium. You can alternatively click to introduce a localised perturbation, or directly input a different initial condition. Importantly all parameters and functional forms can also be changed. 

Below we highlight specific parameters that give different dynamics.

### Reaction--diffusion system
This [reaction--diffusion simulation](/sim/?preset=TuringNotEnoughRD) explores the system

$$
\begin{aligned}
\pd{u}{t}&=\nabla^2 u+u-v-eu^3,\\ \pd{v}{t}&=D\nabla^2 v+ a v(v + c)(v - d) +  b u - e v^3.
\end{aligned}
$$

### Keller--Segel chemotaxis
This [Keller--Segel simulation](/sim/?preset=TuringNotEnoughKellerSegel) corresponds to the equations

$$
\begin{aligned}\pd{u}{t} &=  \nabla^2 u - c\vnabla \cdot(u\vnabla v) +u(b - u)(u - d),\\
\pd{v}{t} &= D \nabla^2 v + u-av.
\end{aligned}
$$

Localised solutions can be found by setting $c=5$ and $d=0.1$. Reducing $d$ further to $0.01$ for this value of $c$ leads to spatiotemporal behaviour similar to using the purely logistic demographic term as in this [alternative model](/mathematical-biology/keller-segel).

### Biharmonic equation
This [biharmonic simulation](/sim/?preset=TuringNotEnoughBiharmonic) corresponds to the equation

$$
\pd{u}{t} = - D\nabla^2 u -  \nabla^4 u + au(c - u)(u - b).
$$

Setting $D=1.87$ will instead lead to localised states that are near the boundary of stability. These will decay slowly for $D\leq 1.85$ but appear to remain stable for $D=1.87$.