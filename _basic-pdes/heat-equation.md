---
layout: page
title: Get started with the heat equation
lesson_number: 10
thumbnail: /assets/images/heat-equation.png
extract: Let's see how heat diffuses over time
equation: $\pd{u}{t}=D \nabla^2 u$
---
Let's start by solving the [heat equation](https://en.wikipedia.org/wiki/Heat_equation),

$$\pd{u}{t}=D \nabla^2 u,$$

on a [rectangular 2D domain](/user-guide/quick-start#domain-shape) with homogeneous Neumann (aka no-flux) [boundary conditions](/user-guide/quick-start#boundary-conditions),

$$\pd{u}{x}(0,y,t) = \pd{u}{x}(L_x,y,t) = \pd{u}{y}(x,0,t) = \pd{u}{y}(x,L_y,t) = 0.$$

1. Load the [interactive simulation](/sim/?preset=heatEquation), which has been set up for this tutorial.

1. Click or tap on the screen to visualise the spread of heat throughout the domain. When you click/tap, you add localised heat to the domain.

1. Now press {{ layout.pause }}, paint some initial data, and then press {{ layout.play }} to set it in motion.

1. Press {{ layout.erase }} to clear the screen. 

### Playing with the diffusion coefficient, $D$

What does changing the diffusion coefficient, $D$, do? 

1. Change its value by clicking {{ layout.equations }} and editing the value of $D$: try increasing it by a factor of 10. 

1. Now click again on the screen and see how fast this blob spreads out throughout the domain. 

Explore how the speed depends on the diffusion coefficient. You can safely increase $D$ up to around $D=50$ without hitting numerical problems: see the discussion on [timestepping issues](/user-guide/solver#timestepping). 

### Playing with boundary conditions

What effect do the boundary conditions have? 

1. Click around the corners and edges to see how the Neumann boundary conditions conserve the total amount of heat within the domain. 

1. Now, go to {{ layout.equations }}→**Boundary conditions** and select **Periodic** for $u$. What do you notice? Is the total amount of heat still conserved? 

1. What if you change the boundary conditions to **Dirichlet**? 

Explore how heat flows through the domain under these different scenarios.

### Exact solutions in 1D

We now explore analytical solutions in one spatial dimension. We can solve the equation to get the following solution using the initial condition,

$$
u(x,0) = \cos\left(\frac{m\pi}{L}\right) \implies u(x,t) = e^{-D\left(\frac{m\pi}{L}\right)^2}\cos\left(\frac{m\pi}{L}\right),
$$

with $m$ a positive integer. These solutions decay to 0 as time increases. Importantly, the rate of decay depends on the frequency of the initial perturbation $m$, with larger $m$ (or larger $D$) leading to more quickly decaying solutions. You can explore these solutions [here](/sim/?preset=heatEquation1D).
