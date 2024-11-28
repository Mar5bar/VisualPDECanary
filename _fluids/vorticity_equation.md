---
layout: page
title: "Fluids via the vorticity equation"
# permalink: /vorticity-equation/
lesson_number: 4
thumbnail: /assets/images/Vorticity.webp
extract: Spinning fluids
equation: $\pd{\omega}{t} = \nu \nabla^2 \omega - \pd{\psi}{y}  \pd{\omega}{x} +  \pd{\psi}{x}  \pd{\omega}{y}$, $0 = \nabla^2 \psi + \omega$
categories: [fluids, waves, parabolic]
---



We consider a 2D form of the [vorticity equation](https://en.wikipedia.org/wiki/Vorticity_equation) of fluid dynamics given by

$$\begin{aligned}
\begin{aligned}
    \pd{\omega}{t} &= \nu \nabla^2 \omega - \pd{\psi}{y}  \pd{\omega}{x} +  \pd{\psi}{x}  \pd{\omega}{y},\\
    0 &= \nabla^2 \psi + \omega,\\
    \pd{S}{t} &= D \nabla^2 S -\left( \pd{\psi}{y}  \pd{S}{x} -  \pd{\psi}{x}  \pd{S}{y}\right).
    \end{aligned}
    \end{aligned}$$
    
Here, $\nu$ is a viscosity parameter, $\omega$ is the magnitude of the vorticity (pointing out of the screen when positive), and $\psi$ is a [stream function](https://en.wikipedia.org/wiki/Stream_function). We also include a passive scalar field, $S$, which diffuses at a rate $D$ and is advected by the fluid flow (i.e. this is exactly a [convection-diffusion equation](/basic-pdes/advection-equation) but now for a flow that we are solving for).

* Load the interactive [vorticity equation model](/sim/?preset=NavierStokesVorticity). By default, we plot the vorticity $\omega$, but you can press {{ layout.views }} to instead plot the horizontal fluid velocity $u$, the vertical fluid velocity $v$, the speed $\sqrt{u^2+v^2}$, or the passive scalar $S$.

* Click to initiate a positive vortex, which will induce a counter-clockwise fluid flow. Clicking again will allow you to paint additional vortices which will then interact. 

* Right-clicking[^1] will paint clockwise (negative) vortices. Placing exactly the same strength positive and negative vortex next to one another will give an approximately unidirectional flow.

* The initial conditions are uniformly zero, and the boundary conditions are periodic, except for the field $S$ which instead is a gradient. In this [alternative simulation](/sim/?preset=NavierStokesVorticityBounded), the initial conditions are instead given by oscillations in the vorticity with frequency $k$ over the domain. 

# Numerical Details

The Poisson equation for $\psi$ is elliptic and VisualPDE cannot directly solve such equations (as they are in some sense non-local). Instead, we solve the parabolic relaxation of this equation given by

$$\begin{aligned}
\begin{aligned}
    \epsilon \pd{\psi}{t} = \nabla^2 \psi + \omega,    \end{aligned}
    \end{aligned}$$

where $\epsilon$ is a small parameter.

[^1]: Unfortunately, this is not currently supported on touch devices.