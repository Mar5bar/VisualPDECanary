---
layout: page
title: Sources and sinks of heat
lesson_number: 30
thumbnail: /assets/images/InhomHeatEquation.webp
extract: Diffusion in an inhomogeneous medium
equation: $\pd{T}{t}= \vnabla\cdot(g(x,y)\vnabla T)+f(x,y)$
---
We now consider an inhomogeneous [heat equation](https://en.wikipedia.org/wiki/Heat_equation) given by

$$\pd{T}{t}=D \nabla^2 T+f(x,y),$$ 

$$f(x,y) = D\pi^2\left(\frac{n^2}{L_x^2} + \frac{m^2}{L_y^2}\right)\cos \left(\frac{n\pi x}{L_x} \right)\cos \left(\frac{m\pi y}{L_y} \right)$$

with homogeneous Neumann (aka no-flux) boundary conditions on a rectangular domain with side lengths $L_x$, $L_y$. You can use [separation of variables](https://en.wikipedia.org/wiki/Separation_of_variables#Partial_differential_equations) to show that the solution at steady state looks like

$$T(x,y) = -\cos \left(\frac{n\pi x}{L_x} \right)\cos \left(\frac{m\pi y}{L_y} \right).$$

* Load this [interactive simulation](/sim/?preset=inhomogHeatEquation). 

* You can change the values of $m$ and $n$ to observe different patterns of sources/sinks of heat in the domain.

* You can use any function $f(x,y)$ instead of the one given above. However, if $f(x,y)$ does not satisfy the constraint that $\int_0^{L_y}\int_0^{L_x} f(x,y) \, \d x \, \d y=0$, then the solution will either grow or decrease without bound. An easy way to prove this is to multiply the equation by $T$ and integrate to find, after applying the Neumann boundary conditions,
 
$$
\frac{1}{2}\pd{}{t}\int_0^{L_y} \int_0^{L_x} T^2 \, \d x \, \d y = \int_0^{L_y}\int_0^{L_x} f(x,y) \, \d x \, \d y.
$$

## Inhomogeneous transport

We can also consider a diffusion coefficient which varies in space by studying

$$
\pd{T}{t}= \vnabla\cdot(g(x,y)\vnabla T),
$$

where we need $g(x,y)>0$ for all $x,y$ in the domain. As a simple (though complicated-looking) example, we take,

$$g(x,y) = D\left[1+E\cos\left(\frac{n \pi}{L_xL_y}\sqrt{(x-L_x/2)^2+(y-L_y/2)^2}\right)\right],$$

where $D>0$, $n>0$, and $\lvert E\rvert <1$ are constants. This represents radially-oscillating regions of high and low diffusion. Setting an initial condition of $$u(x,y,0)=1$$ and Dirichlet boundary conditions, we can observe an immediate partitioning of the initial heat into regions bounded by the maxima of the cosine function. Click in this [inhomogeneous simulation](/sim/?preset=inhomogDiffusionHeatEquation) to see this, and play around with the values of $n$, $E$ and $D$.
