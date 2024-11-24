---
layout: page
title: "Fluids via the vorticity equation"
# permalink: /vorticity-equation/
lesson_number: 4
thumbnail: /assets/images/Vorticity.webp
extract: Water waves and ripples
equation: $\pd{\omega}{t} = \nu \lap \omega - \pd{\psi}{y}  \pd{\omega}{x} +  \pd{\psi}{x}  \pd{\omega}{y}$, $0 &= \lap \psi + \omega$
categories: [fluids, waves, parabolic]
---



We consider a 2D form of the [vorticity equation](https://en.wikipedia.org/wiki/Vorticity_equation) of fluid dynamics given by

$$\begin{aligned}
\begin{aligned}
    \pd{\omega}{t} &= \nu \lap \omega - \pd{\psi}{y}  \pd{\omega}{x} +  \pd{\psi}{x}  \pd{\omega}{y}\\
    0 &= \lap \psi + \omega\\
    \pd{S}{t} &= D \lap S -\left( \pd{\psi}{y}  \pd{S}{x} -  \pd{\psi}{x}  \pd{S}{y}\right),
    \end{aligned}
    \end{aligned}$$
    
where $\nu$ is a rescaled viscosity parameter, $\omega$ is the magnitude of the vorticity (pointing out of the screen when positive), and $\psi$ is a [2D stream function](https://en.wikipedia.org/wiki/Stream_function). We also include a passive scalar field, $S$, which diffuses at a rate $D$ and is advected by the fluid flow (i.e. this is exactly a [convection-diffusion equation](/basic-pdes/advection-equation) but now for a flow that we solve resolve in the simulation).

* Load the interactive [vorticity equation model](/sim/?preset=NavierStokesVorticity). By default, the value of vorticity ($\omega$) will be plotted, but you can press {{ layout.views }} to instead plot the horizontal fluid velocity $u$, the vertical fluid velocity $v$, the speed $u^2+v^2$, or the passive scalar $S$.

* Click to initiate a positive vortex, which will induce a counter-clockwise fluid flow. Clicking again will allow you to paint additional vortices which will then interact. 

* Right-clicking will paint clockwise (negative) vortices. Placing exactly the same strength positive and negative vortex next to one another will give an approximately uni-directional flow.

* The initial conditions are uniformly zero, and the boundary conditions are periodic, except for the field $S$ which instead is a gradient. In [this alternative simulation](/sim/?preset=NavierStokesVorticityBounded), the initial conditions are instead given by oscillations in the vorticity with frequency $k$ over the domain. 



# Numerical Details

The Poisson equation for $\psi$ is elliptic, and VisualPDE by default cannot solve such equations as they are in some sense non-local. So instead we solve the parabolic relaxation of this equation given by,

$$\begin{aligned}
\begin{aligned}
    \epsilon \pd{\psi}{t} = \lap \psi + \omega,    \end{aligned}
    \end{aligned}$$

where $\epsilon$ is a small enough parameter to capture the behaviour we want.
