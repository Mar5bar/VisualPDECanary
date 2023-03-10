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

on a square 2D domain with homogeneous Neumann (aka no-flux) boundary conditions,

$$\pd{u}{x}(0) = \pd{u}{x}(L) = \pd{u}{y}(0) = \pd{u}{y}(L) = 0.$$

1. Load the [interactive simulation](/sim/?preset=waveEquation), which has been set up for this tutorial.

1. Click or tap on the screen to visualise a disturbance in the medium which will then propagate in all directions. 

1. Now press {{ layout.pause }}, paint some initial data, and then press {{ layout.play }} to set it in motion.

1. Press {{ layout.erase }} to clear the screen. 

### Playing with the diffusion coefficient, $D$

What does changing the diffusion coefficient, $D$, do? 

1. Change its value by clicking {{ layout.equations }} and editing the value of $D$: try increasing it by a factor of 10. 

1. Now click again on the screen and see how fast the disturbance spreads out throughout the domain. 

Explore how the speed depends on the diffusion coefficient. You can safely increase $D$ up to [VALUE] without hitting numerical problems: see the discussion on forward Euler ELSEWHERE. 

### Playing with boundary conditions

What effect do the boundary conditions have? 

1. Click around the corners and edges to see how the Neumann boundary conditions cause the wave to bounce around within the box.

1. Now, go to {{ layout.equations }}→**Boundary conditions** and select **Periodic** for $u$. What do you notice? 

1. What if you change the boundary conditions to **Dirichlet**? 

Explore how waves propagate through the domain under these different scenarios.

## Numerical notes

Our solver only works for systems of first-order equations. So in fact what is being simulated is the system

$$\begin{aligned}\pd{u}{t}&=v+CD\nabla^2 u,\\
 \pd{v}{t} &= D \nabla^2 u,
 \end{aligned}$$

which becomes the wave equation when $C=0$. 

The parameter $C$ is used to prevent spurious oscillations due to the equation being [hyperbolic](https://en.wikipedia.org/wiki/Hyperbolic_partial_differential_equation). Try varying the value of $C$ to observe how it changes the solution structure.

## Standing wave solutions

If we take initial conditions of 

$$\begin{aligned}u(x,y,0) &= \cos(n \pi x)\cos(m \pi y),\\ 
\pd{u}{t}(x,y,0)&=0,\end{aligned}$$ 

with Neumann boundary conditions, we can find a standing wave solution of the form

$$
u(x,y,t) = \cos(D\pi\sqrt{n^2+m^2}\,t)\cos(n \pi x)\cos(m \pi y),
$$

which oscillates in time and space. 

You can play with such an initial condition [here](/sim/?preset=waveEquationICs), changing $n$ and $m$, and restarting the simulation by pressing {{ layout.erase }} to see how these parameters influence the solution. 

The damping factor $C$ is also set to zero in this case. If you increase its value, the solution amplitude will decay over time. If you change the boundary conditions to Dirichlet (and set $C=0.01$), the simulation will exhibit some fascinatingly symmetric oscillations.
