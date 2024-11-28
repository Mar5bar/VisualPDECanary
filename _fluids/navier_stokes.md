---
layout: page
title: "2D Navier-Stokes"
# permalink: /navier-stokes/
lesson_number: 4
thumbnail: /assets/images/NavierStokes.webp
extract: Fluid motion
equation: $\pd{\v{u}}{t} + \v{u}\cdot \vnabla \v{u} = \nu \nabla^2 \v{u} - \vnabla p,$ $\vnabla \cdot \v{u} = 0$
categories: [fluids, waves, parabolic]
---


We consider the 2D incompressible [Navier-Stokes equations](https://en.wikipedia.org/wiki/Navier%E2%80%93Stokes_equations) given by

$$\begin{aligned}
      \pd{u}{t} &= \nu \nabla^2 u -\left(u  \pd{u}{x} + v  \pd{u}{y}\right) -  \pd{p}{x},\\
      \pd{v}{t} &= \nu \nabla^2 v -\left(u  \pd{v}{x} + v  \pd{v}{y}\right) -  \pd{p}{y},\\
     0 &= \pd{u}{x} + \pd{v}{u},\\
      \pd{S}{t} &= D \nabla^2 S -\left(u  \pd{S}{x} + v  \pd{S}{y}\right),
    \end{aligned}$$

where $u$ and $v$ are the horizontal and vertical fluid velocities, respectively, $p$ is the pressure, and $\nu$ is a viscosity parameter. We have added a passive scalar field $S$ with diffusion constant $D$ that is transported by the flow.

* Load the interactive [Navier-Stokes model](/sim/?preset=NavierStokes). By default, the speed $\sqrt{u^2+v^2}$ is plotted, with arrows indicating the flow of the fluid. You can press {{ layout.views }} to instead plot the horizontal fluid velocity $u$, the vertical fluid velocity $v$, the vorticity $\omega = \pd{v}{x} - \pd{u}{y}$, or the passive scalar $S$.

* Clicking will add to $u$, effectively causing the fluid to locally move to the right. Right-clicking[^1] will do the opposite, leading to a left-moving fluid. 

# Vortex shedding

We can modify the simulation above to use the variable $S$ as an obstruction rather than a diffusible species, allowing you to click to place a cylindrical region that the flow has to move around. This is implemented in this [interactive simulation of vortex shedding](/sim/?preset=NavierStokesFlowCylinder). 

Clicking places a cylindrical region into the flow, which appears dark. If you simulate for long enough, eventually the flow behind the cylinder will become unstable, leading to spontaneous vortex shedding. Clicking again allows you to place another cylinder, leading to very complex flow fields. 

Note that some configurations may become numerically unstable; if so, increasing the value of $\nu$ will often lead to a more stable simulation, but a more diffusive flow. Avoiding placing obstacles near the boundaries of the simulation will also improve numerical stability.


# Numerical details

The divergence-free condition on the velocity is essentially an elliptic constraint, and VisualPDE by default cannot solve such equations as they are in some sense non-local. Instead, we solve a variation knows as a 'generalised pressure equation' given by

$$\begin{aligned}
\begin{aligned}
     \pd{p}{t} = \nu\nabla^2 p + \frac{1}{M^2}\left (\pd{u}{x}+\pd{v}{y} \right ),    \end{aligned}
    \end{aligned}$$

where $M$ is a tuning parameter (a scaled version of the Mach number) related to the speed of pressure waves.

[^1]: Unfortunately, this is not currently supported on touch devices.