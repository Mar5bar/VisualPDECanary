---
layout: page
title: Sources and sinks of heat
lesson_number: 30
thumbnail: /assets/images/InhomHeatEquation.PNG
extract: Diffusion in an inhomogeneous medium
equation: $\pd{u}{t}= \vnabla\cdot(g(x,y)\vnabla u)+f(x,y)$
---
We now consider an inhomogeneous [heat equation](https://en.wikipedia.org/wiki/Heat_equation) given by

$$\pd{u}{t}=D \nabla^2 u+f(x,y),$$ 

$$f(x,y) = D\pi^2\left(\frac{n^2}{L_x^2} + \frac{m^2}{L_y^2}\right)\cos \left(\frac{n\pi x}{L_x} \right)\cos \left(\frac{m\pi y}{L_y} \right)$$

with homogeneous Neumann (aka no-flux) boundary conditions on a rectangular domain with side lengths $L_x$, $L_y$. You can use [separation of variables](https://en.wikipedia.org/wiki/Separation_of_variables#Partial_differential_equations) to show that the solution at steady state looks like

$$u(x,y) = -\cos \left(\frac{n\pi x}{L_x} \right)\cos \left(\frac{m\pi y}{L_y} \right).$$

* Load the [interactive simulation](/sim/?preset=inhomogHeatEquation). 

* You can change the values of $m$ and $n$ to observe different patterns of sources/sinks of heat in the domain.

* You can use any function $f(x,y)$ instead of the one given above. However, if $f(x,y)$ does not satisfy the constraint that $\int_0^{L_y}\int_0^{L_x} f(x,y) \, \d x \, \d y=0$, then the solution will either grow or decrease without bound. An easy way to prove this is to multiply the equation by $u$ and integrate to find, after applying the Neumann boundary conditions,
 
$$
\frac{1}{2}\pd{}{t}\int_0^{L_y} \int_0^{L_x} u^2 \, \d x \, \d y = \int_0^{L_y}\int_0^{L_x} f(x,y) \, \d x \, \d y.
$$

## Inhomogeneous transport

We can also consider a diffusion coefficient which varies in space by studying

$$
\pd{u}{t}= \vnabla\cdot(g(x,y)\vnabla u),
$$

where we need $g(x,y)>0$ for all $x,y$ in the domain. As a simple (though complicated-looking) example, we take,

$$g(x,y) = D\left[1+E\cos\left(\frac{n \pi}{L_xL_y}\sqrt{(x-L_x/2)^2+(y-L_y/2)^2}\right)\right],$$

where $D>0$, $n>0$, and $\lvert E\rvert <1$ are constants. This represents radially-oscillating regions of high and low diffusion. Setting an initial condition of $$u(x,y,0)=1$$ and Dirichlet boundary conditions, we can observe an immediate partitioning of the initial heat into regions bounded by the maxima of the cosine function. Click [here](/sim/?preset=inhomogDiffusionHeatEquation) to see this, and play around with the values of $n$, $E$ and $D$.
