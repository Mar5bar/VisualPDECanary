---
layout: page
title: Sources and sinks of heat
lesson_number: 30
thumbnail: /assets/images/InhomHeatEquation.PNG
extract: Diffusion in an inhomogeneous medium
equation: $\pd{u}{t}= \nabla\cdot(D(x,y)\nabla u)+f(x,y)$
---
We now consider an inhomogeneous [heat equation](https://en.wikipedia.org/wiki/Heat_equation),

$$\pd{u}{t}=D \nabla^2 u+f(x,y)$$, $$f(x,y) = D\pi^2(n^2+m^2)\cos\left (n\pi x \right)\cos\left (m\pi y \right)$$

with homogeneous Neumann (aka no-flux) boundary conditions. You can use [separation of variables](https://en.wikipedia.org/wiki/Separation_of_variables#Partial_differential_equations) to show that the solution at steady state looks like,

$$u(x,y) = -\cos\left (n\pi x \right)\cos\left (m\pi y \right). $$

* Load the [interactive simulation](/sim/?preset=inhomogHeatEquation). 

* You can change the values of $m$ and $n$ to observe different patterns of sources/sinks of heat in the domain.

* You can use any function $f(x,y)$ instead of the one given above. However, if $f(x,y)$ does not satisfy the constraint that $\int_0^1\int_0^1 f(x,y) dxdy=0$, then the solution will either grow or decrease without bound. An easy way to prove this is to multiply the equation by $u$ and integrate to find, after applying the Neumann boundary conditions,
 
$$
\frac{1}{2}\pd{}{t}\int_0^1 \int_0^1 u^2dxdy = \int_0^1\int_0^1 f(x,y) dxdy.
$$

## Inhomogeneous transport

We can also consider a diffusion coefficient which varies in space by studying

$$
\pd{u}{t}= \nabla\cdot(D(x,y)\nabla u),
$$

where we need $D(x,y)>0$ for all $x,y$ in the domain. As a simple (but complicated-looking) example, we take,

$$
D(x,y) = D(1+E\cos(n \pi (\sqrt{(x-0.5)^2+(y-0.5)^2})))
$$

where $D>0$, $n>0$, and $|E|<1$ are constants. This represents radially-oscillating regions of high and low diffusion. Setting an initial condition of $u(x,y,0)=1$ and Dirichlet boundary conditions, we can observe an immediate partitioning of the initial heat into regions bounded by the maxima of the cosine function. Click [here](/sim/?preset=inhomogDiffusionHeatEquation) to see this, and play around with the values of $n$, $E$, and $D$.
