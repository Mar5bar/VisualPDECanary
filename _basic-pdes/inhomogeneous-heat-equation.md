---
layout: page
title: Sources and sinks of heat
lesson_number: 30
thumbnail: /assets/images/InhomHeatEqn.png
extract: Diffusion in an inhomogeneous medium
equation: $\pd{u}{t}=D \nabla^2 u$
---
We now consider an inhomogeneous [heat equation](https://en.wikipedia.org/wiki/Heat_equation),

$$\pd{u}{t}=D \nabla^2 u+f(x,y), \quad f(x,y) = a\cos\left (n\pi x \right)\cos\left (m\pi y \right)$$

with homogeneous Neumann (aka no-flux) boundary conditions. One can use separation of variables

1. Load the [interactive simulation](/sim/?preset=inhomogHeatEquation). 

1. Click within the box to visualise the spread of some source of heat throughout the domain. 

1. You can increase the diffusion coefficient (for example, by removing a zero) to increase how fast this blob spreads out throughout the domain. 

1. You can also click around the corners/edges to see how the boundary conditions conserves the total amount of heat within the domain. 

1. Press clear at the top right to reset the simulation. 

1. You can also pause the simulation, paint some initial data, and then click 'play' to set it in motion. Explore how the speed depends on the diffusion coefficient (though note that this coefficient can't be too large without running into numerical problems -- see the discussion on Forward Euler ELSEWHERE). 

## Playing with boundary conditions

1. Now, go to `Boundary conditions` and select `Periodic`. What do you notice? Is the total amount of heat still conserved? 

1. What if you change it to Dirichlet? 

Explore how heat flows through the domain under these different scenarios.
