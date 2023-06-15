---
layout: page
title: Kuramoto–Sivashinsky equation
lesson_number: 40
thumbnail: /assets/images/KuramotoSivashinsky.webp
extract: Phase separation
equation: $\pd{u}{t}=-\nabla^2u-\nabla^4u-|\vnabla u|^2 $
---
We now study the [Kuramoto–Sivashinsky equation](https://en.wikipedia.org/wiki/Kuramoto%E2%80%93Sivashinsky_equation),

$$\pd{u}{t} = -\nabla^2u-\nabla^4u-|\nabla u|^2,$$

with periodic boundary conditions.

* Load the [interactive simulation](/sim/?preset=KuramotoSivashinsky). If you perturb the solution, it should devolve into a kind of spatiotemporal chaos of oscillation and movement. Importantly, the patterns which emerge have a certain set of coherent wavelengths, which suggests that the dynamics is that of finite-dimensional chaos, rather than fully turbulent mixing.

## Numerical notes

The equation above is far from the cross-diffusion kind of system our solver is built for. However, using the product rule and an algebraic substitution, we can write it as:

$$\begin{align} 
\pd{u}{t}& = -\vnabla \cdot [ (1+u)\vnabla u + \vnabla v]+uv-au, \\
 v& = \nabla^2 u,
\end{align}$$

where $a$ is a damping coefficient used to help stabilise the solver. For $a=0$, this is exactly the fourth-order equation above.
