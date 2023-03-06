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

with homogeneous Neumann (aka no-flux) boundary conditions.

1. Load the [interactive simulation](/sim/?preset=heatEquation). 

1. Click within the box to visualise the spread of some source of heat throughout the domain. 

1. You can increase the diffusion coefficient (for example, by removing a zero) to increase how fast this blob spreads out throughout the domain. 

1. You can also click around the corners/edges to see how the boundary conditions conserves the total amount of heat within the domain. 

1. Press clear at the top right to reset the simulation. 

1. You can also pause the simulation, paint some initial data, and then click 'play' to set it in motion. Explore how the speed depends on the diffusion coefficient (though note that this coefficient can't be too large without running into numerical problems -- see the discussion on Forward Euler ELSEWHERE). 

## Playing with boundary conditions

1. Now, go to `Boundary conditions` and select `Periodic`. What do you notice? Is the total amount of heat still conserved? 

1. What if you change it to Dirichlet? 

Explore how heat flows through the domain under these different scenarios.
