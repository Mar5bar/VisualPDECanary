---
layout: page
title: Schrödinger Equation
lesson_number: 50
thumbnail: /assets/images/SchrodingerEquation.PNG
extract: Quantum mechanics
equation: $i\hbar\pd{\psi}{t}=-\frac{\hbar}{2m}\nabla^2 \psi+V(x,t)\psi$
---
We now consider the [Schrödinger equation](https://en.wikipedia.org/wiki/Schrödinger_equation),

$$i\hbar\pd{\psi}{t}=-\nabla^2 \psi+V(x,t)\psi$$

with homogeneous Dirichlet boundary conditions. We will first consider a variant of this equation with \emph{artificial diffusion}, as in [the wave equation](/basic_pdes/wave-equation) shown before, which takes the form

$$\pd{\psi}{t}=iD\nabla^2 \psi+DC\nabla^2 \psi,$$

where $D,C>0$ are positive constants. We use the initial condition $\psi(x,y,0) = \sin(m\pi x)\sin(n\pi y)$, as this corresponds to a given energy state of the system.

* Load the [interactive simulation](/sim/?preset=stabilizedSchrodingerEquation). 

* You can change the initial eigenfunction frequency by modifying $n$ and $m$, and then pressing 'r' to restart the simulation.

* By default, the solution plotted is the density $$\lvert \psi\rvert^2 = \Re(\psi)^2+\Im(\psi)^2 = u^2+v^2$$, which will be (approximately) stationary for long periods of time. You can plot only the real or imaginary part under 'Colour,' and see how these solutions now oscillate in both space and time. Increasing the values of $n$ and $m$ will increase the speed at which this oscillation occurs, as such an initial condition will correspond to higher energy states.

## Heterogeneous potentials

We can also choose a potential $V(x,y)$ which has the effect of localizing some features of the solution. As an example, we consider 

$$V(x,y) = \sin(n \pi x)\sin(m\pi y), \quad $$ $$\psi(x,y,0) = (\sin(\pi x)\sin(\pi y))^10, $$

which can be played with [here](/sim/?preset=stabilizedSchrodingerEquationPotential). As the solution evolves, one can observe 'tunneling' from local potential wells where the solution is highly concentrated, out to potential wells further away from the localized initial condition. Note that here the colorscale is constantly changing to observe the maximal and minimal values of $\lvert \psi \rvert$, as these vary substantially during an oscillation.

## Numerical Notes

The solver only works for real systems of equations. So in fact what is being simulated is the system,

$$\pd{u}{t}=-D\nabla^2 v+CD\nabla^2 u+V(x,y) v, \quad $$ $$\pd{v}{t} = D\nabla^2 u+CD\nabla^2 v-V(x,y)u,$$

which is a (nondimensionalized) Schrödinger equation for $C=0$. The parameter $C$ is used to prevent spurious oscillations. 
