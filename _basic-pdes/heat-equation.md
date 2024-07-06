---
layout: page
title: Get started with the heat equation
lesson_number: 10
thumbnail: /assets/images/heat-equation.webp
extract: Explore how heat diffuses over time
equation: $\pd{T}{t}=D_T \nabla^2 T$
categories: [linear]
---
Let's start by solving the [heat equation](https://en.wikipedia.org/wiki/Heat_equation),

$$\pd{T}{t}=D_T \nabla^2 T,$$

on a [rectangular 2D domain](/user-guide/quick-start#domain-shape) with homogeneous Neumann (aka no-flux) [boundary conditions](/user-guide/quick-start#boundary-conditions),

$$\pd{T}{x}(0,y,t) = \pd{T}{x}(L_x,y,t) = \pd{T}{y}(x,0,t) = \pd{T}{y}(x,L_y,t) = 0.$$

1. Load the [interactive simulation](/sim/?preset=heatEquation), which has been set up for this tutorial.

1. Click on the screen to visualise the spread of heat throughout the domain. When you click, you add localised heat to the domain.

1. Now press {{ layout.pause }}, paint some initial data, and then press {{ layout.play }} to set it in motion.

1. Press {{ layout.erase }} to clear the screen.

1. You can press {{ layout.views }} to change from a plot of just the density of $T$ to a plot of $T$ augmented with the vector field given by $-\vnabla T$. This makes arrows that show the flux of heat as it dissipates and moves around the domain.

### Playing with the diffusion coefficient, $D_T$

What does changing the diffusion coefficient, $D_T$, do? 

1. Change its value by clicking {{ layout.equations }} and editing the value of $D_T$: try increasing it by a factor of 10. 

1. Now click again on the screen and see how fast this blob spreads out throughout the domain. 

Explore how the speed depends on the diffusion coefficient. You can safely increase $D_T$ up to around $D=50$ without hitting numerical problems: see the discussion on [timestepping issues](/user-guide/solver#timestepping). 

### Playing with boundary conditions

What effect do the boundary conditions have? 

1. Click around the corners and edges to see how the Neumann boundary conditions conserve the total amount of heat within the domain. 

1. Now, go to <span class='click_sequence'>{{ layout.equations }} → **Boundary conditions**</span> and select **Periodic** for $T$. What do you notice? Is the total amount of heat still conserved? 

1. What if you change the boundary conditions to **Dirichlet**? 

Explore how heat flows through the domain under these different scenarios.

### Exact solutions in 1D

We now explore analytical solutions in one spatial dimension. We can solve the equation to get the following solution using the initial condition,

$$
T(x,0) = \cos\left(\frac{m\pi}{L}\right) \implies T(x,t) = \mathrm{e}^{-Dt\left(\frac{m\pi}{L}\right)^2}\cos\left(\frac{m\pi x}{L}\right),
$$

with $m$ a positive integer. These solutions decay to 0 as time increases. Importantly, the rate of decay depends on the frequency of the initial perturbation $m$, with larger $m$ (or larger $D_T$) leading to more quickly decaying solutions. 

* You can explore these solutions in this [1D simulation](/sim/?preset=heatEquation1D).
