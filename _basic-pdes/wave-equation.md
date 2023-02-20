---
layout: page
title: Explore the wave equation
lesson_number: 20
thumbnail: /assets/images/waveEquation.png
extract: Play with waves and vibrations
equation: $\pdd{u}{t}=D \nabla^2 u$
---
Let's next look at the [wave equation](https://en.wikipedia.org/wiki/Wave_equation),

$$\pdd{u}{t}=D \nabla^2 u,$$

with homogeneous Neumann (aka no-flux) boundary conditions.

1. Load the [interactive simulation](/sim/?preset=waveEquation). 

1. Click within the box to visualise a disturbance in the medium which will then propogate in all directions. 

1. You can increase the diffusion coefficient (for example, by removing a zero) to increase how fast this disturbance spreads out throughout the domain. 

1. You can also click around the corners/edges to see how the boundary conditions cause the wave to 'bounce' around within the box.

1. Press clear at the top right (or press 'r') to reset the simulation. 

1. You can also pause the simulation ('space') , paint some initial data, and then click 'play' to set it in motion. Explore how the speed depends on the diffusion coefficient (though note that this coefficient can't be too large without running into numerical problems -- see the discussion on Forward Euler ELSEWHERE). 

## Playing with boundary conditions

1. Now, go to `Boundary conditions` and select `Periodic`. What do you notice? Is the total amount of heat still conserved? 

1. What if you change it to Periodic? Dirichlet? 

## Numerical Notes

Our solver only works for systems of first-order equations. So in fact what is being simulated is the system,
$$\pd{u}{t}=v+CD\nabla^2 u, \quad \pd{v}{t} = D \nabla^2 u,$$
which is the wave equation for $C=0$. The parameter $C$ is used to prevent spurious oscillations due to the equation being [hyperbolic](https://en.wikipedia.org/wiki/Hyperbolic_partial_differential_equation). Try varying the value of $C$ to observe how it changes the solution structure.
