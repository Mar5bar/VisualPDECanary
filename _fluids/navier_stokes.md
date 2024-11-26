---
layout: page
title: "2D Navier-Stokes"
# permalink: /navier-stokes/
lesson_number: 4
thumbnail: /assets/images/NavierStokes.webp
extract: Fluid motion
equation: $\pd{\v{u}}{t} + \v{u}\cdot \vnabla \v{u} = \nu \nabla^2 \v{u} - \vnabla p$, $\vnabla \cdot \v{u} = 0$
categories: [fluids, waves, parabolic]
---


We consider a 2D incompressible version of the [Navier-Stokes equations](https://en.wikipedia.org/wiki/Navier%E2%80%93Stokes_equations) given by,

$$\begin{aligned}
      \pd{u}{t} &= \nu \nabla^2 u -\left(u  \pd{u}{x} + v  \pd{u}{y}\right) -  \pd{p}{x},\\
      \pd{v}{t} &= \nu \nabla^2 v -\left(u  \pd{v}{x} + v  \pd{v}{y}\right) -  \pd{p}{y},\\
     \pd{u}{x} + \pd{v}{u} &= 0,\\
      \pd{S}{t} &= D \nabla^2 S -\left(u  \pd{S}{x} + v  \pd{S}{y}\right),
    \end{aligned}$$
    
where $u$ and $v$ are the horizontal and vertical fluid velocities respectively, $p$ is the pressure, $S$ is a passive scalar field with diffusion constant $D$, and $\nu$ is a viscosity parameter.

* Load the interactive [Navier-Stokes model](/sim/?preset=NavierStokes). By default, the speed (given by $u^2+v^2$) is plotted, with arrows indicating the flow of the fluid. You can press {{ layout.views }} to instead plot the horizontal fluid velocity $u$, the vertical fluid velocity $v$, the vorticity $\omega = \pd{v}{x} - \pd{u}{y}$, or the passive scalar $S$.

* Clicking will add to $u$, so effectively cause the fluid to locally move to the right. Right-clicking will subtract from $u$, so lead to a left-moving fluid. 

# Vortex shedding

We can modify the simulation above to use the variable $S$ as instead an obstruction, allowing you to click to place a cylindrical region that the flow has to move around. This is implemented in [this iinteractive simulation of vortex shedding](NavierStokesFlowCylinder). Clicking will place a dark cylindrical region into the flow. If you wait, eventually the flow behind the cylinder will become unstable, leading to spontaneous vortex shedding. Clicking again allows you to place another cylinder, leading to more exotic flow fields. Note that some configurations will become unstable; if so, increasing the value of $\nu$ will often lead to a more stable simulation, but a more diffusive flow.


# Numerical details

The divergence-free condition on the velocity is essentially an elliptic constraint, and VisualPDE by default cannot solve such equations as they are in some sense non-local. So instead we solve a variation knows as a `generalised pressure equation' given by,

$$\begin{aligned}
\begin{aligned}
     \pd{p}{t} = \nu\nabla^2 p + \frac{1}{Ma^2}\left (\pd{u}{x}+\pd{v}{y} \right ),    \end{aligned}
    \end{aligned}$$

where $Ma$ is a tuning parameter (a scaled version of the Mach number) related to the speed of pressure waves.


