---
layout: page
title: Deforming membranes
lesson_number: 60
thumbnail: /assets/images/plateEquation.PNG
extract: The plate equation
equation: $\pdd{u}{t}=-D^2 \nabla^4 u-q$
---
Let's next look at the (damped) [plate equation](https://en.wikipedia.org/wiki/Kirchhoff%E2%80%93Love_plate_theory),

$$\pdd{u}{t}+ C\pd{u}{t}=-D^2 \nabla^4 u-q,$$

with fixed boundary conditions given by

$$u=0 \quad \text{and} \quad \nabla^2 u = 0 $$

along the boundary. 

Here $D$ represents the relative size of the domain and its material properties (e.g. stiffness), $C>0$ a damping constant, and $q>0$ a gravity-like force.

* Load the [interactive simulation](/sim/?preset=plateEquation). 

* Initially the plate is deformed to a value of $u=-4$ everywhere, representing an initial deformation which instantaneously snaps to the fixed condition of $u=0$ at the edges, which gives rise to compression waves which propagate inwards. 

* Click to compress the plate downward locally, and observe waves propagating from this disturbance.

## Numerical notes

As in previous examples, we must write the second time derivative using a system of first-order equations. We also have to use an algebraic equation to represent the biharmonic term:

$$\begin{aligned}\pd{u}{t}&=v+DD_c\nabla^2 u,\\
 \pd{v}{t} &= -D \nabla^2 w -Cv -q,\\
 w &= D \nabla^2u,
 \end{aligned}$$

which is the plate equation for $D_c=0$. The parameter $D_c$ is used to prevent spurious oscillations as seen in the wave equation.

## 3D Deformations


* Load the [interactive simulation](/sim/?preset=plateEquation3D). 
