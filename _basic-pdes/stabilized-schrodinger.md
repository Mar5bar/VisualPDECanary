---
layout: page
title: Schr\"{o}dinger's Equation
lesson_number: 20
thumbnail: /assets/images/waveEquation.PNG
extract: Quantum mechanics
equation: $i\hbar\pd{\psi}{t}=\nabla^2 \psi+V(x,t)\psi$
---
We now consider the [Schr\"{o}dinger equation](https://en.wikipedia.org/wiki/Schrödinger_equation),

$$i\hbar\pd{\psi}{t}=-\nabla^2 \psi+V(x,t)\psi$$

with homogeneous Dirichlet boundary conditions. We will first consider a variant of this equation with \emph{artificial diffusion}, as in [the wave equation](/basic_pdes/wave-equation) shown before, which takes the form

$$\pd{\psi}{t}=iD\nabla^2 \psi+DC\nabla^2 \psi,$$

where $D,C>0$ are positive constants. We use the initial condition $\psi(x,y,0) = \sin(m\pi x)\sin(n\pi y)$, as this corresponds to a given energy state of the system.

* Load the [interactive simulation](/sim/?preset=stabilizedSchrodingerEquation). 

* You can change the initial eigenfunction frequency by modifying $n$ and $m$, and then pressing 'r' to restart the simulation.

* By default, the solution plotted is the density $|\psi|^2 = \Re(\psi)^2+\Im(\psi)^2 = u^2+v^2$, which will be (approximately) stationary for long periods of time. You can plot only the real or imaginary part under 'Colour,' and see how these solutions now oscillate in both space and time. Increasing the values of $n$ and $m$ will increase the speed at which this oscillation occurs, as such an initial condition will correspond to higher energy states.

## Numerical Notes

The solver only works for real systems of equations. So in fact what is being simulated is the system,

$$\pd{u}{t}=-D\nabla^2 v+CD\nabla^2 u, \quad \pd{v}{t} = D\nabla^2 u+CD\nabla^2 v,$$

which is a (nondimensionalized) Schr\"{o}dinger equation for $C=0$. The parameter $C$ is used to prevent spurious oscillations. 
