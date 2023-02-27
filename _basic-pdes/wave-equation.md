---
layout: page
title: Explore the wave equation
lesson_number: 20
thumbnail: /assets/images/waveEquation.PNG
extract: Play with waves and vibrations
equation: $\pdd{u}{t}=D \nabla^2 u$
---
Let's next look at the [wave equation](https://en.wikipedia.org/wiki/Wave_equation),

$$\pdd{u}{t}=D \nabla^2 u,$$

with homogeneous Neumann (aka no-flux) boundary conditions.

* Load the [interactive simulation](/sim/?preset=waveEquation). 

* Click within the box to visualise a disturbance in the medium which will then propogate in all directions. 

* You can increase the diffusion coefficient (for example, by removing a zero) to increase how fast this disturbance spreads out throughout the domain. 

* You can also click around the corners/edges to see how the boundary conditions cause the wave to bounce around within the box.

* Press clear at the top right (or press R) to reset the simulation. 

* You can also pause the simulation (space bar), paint some initial data, and then click play to set it in motion. Explore how the speed depends on the diffusion coefficient (though note that this coefficient can't be too large without running into numerical problems -- see the discussion on forward Euler ELSEWHERE). 

## Numerical notes

Our solver only works for systems of first-order equations. So in fact what is being simulated is the system

$$\begin{aligned}\pd{u}{t}&=v+CD\nabla^2 u,\\
 \pd{v}{t} &= D \nabla^2 u,
 \end{aligned}$$

which is the wave equation for $C=0$. The parameter $C$ is used to prevent spurious oscillations due to the equation being [hyperbolic](https://en.wikipedia.org/wiki/Hyperbolic_partial_differential_equation). Try varying the value of $C$ to observe how it changes the solution structure.

## Standing wave solutions

If we take $u(x,y,0) = \cos(n \pi x)\cos(m \pi y)$ and $u_t(x,y,0)=0$ with Neumann boundary conditions, we can find a standing wave solution of the form

$$
u(x,y,t) = \cos(D\pi\sqrt{n^2+m^2}t)\cos(n \pi x)\cos(m \pi y),
$$

which oscillates in time and space. You can play with such an initial condition [here](/sim/?preset=waveEquationICs), changing $n$ and $m$, and restarting the simulation by pressing R to see how these parameters influence the solution. The damping factor $C$ is also set to zero in this case. If you increase its value, the solution amplitude will decay over time. If you change the boundary conditions to Dirichlet (and set $C=0.01$), the simulation will exhibit some fascinatingly symmetric oscillations.
