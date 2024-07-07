---
layout: page
title: "Shallow water equations"
# permalink: /shallow-water/
lesson_number: 10
thumbnail: /assets/images/shallow-water-waves.webp
extract: Water waves and ripples
equation: $\pd{h}{t} = - \vnabla \cdot \left( \v{u} \left(h+H_{e}\right)\right)$, $\pd{\v{u}}{t} = \nu \nabla^2  {\v{u}} -g \vnabla h - k {\v{u}}-({\v{u}}\cdot \vnabla){\v{u}}-\v{f}\times \v{u}$
categories: [fluids, waves, integrable]
---

We consider a form of the [shallow water equations](https://en.wikipedia.org/wiki/Shallow_water_equations) given by

$$\begin{aligned}
      \pd{h}{t} &= - \left( \pd{u}{x} +  \pd{v}{y}\right) \left(h+H_{e}\right)-\left( \pd{h}{x} u+ \pd{h}{y} v\right)-\varepsilon h\\
      \pd{u}{t} &= \nu \nabla^2  u -g \pd{h}{x} - k u-u  \pd{u}{x}-v  \pd{u}{y}+f v\\
      \pd{v}{t} &= \nu \nabla^2  v -g  \pd{h}{y} - k v-u  \pd{v}{x}-v  \pd{v}{y}-f u
    \end{aligned}$$
    
where $h$ is is the water height, $u$ and $v$ are the fluid velocities in $x$ and $y$ directions, and all of the parameters are as described in the article linked above except for $H_e$ replacing the mean height of the surface $H$, and the term involving $\varepsilon$ representing a weak dissipation of the wave height $h$. The terms involving $k$ and $\varepsilon$ lead to dissipation of the waves, and can be understood either as phenomenological drag coefficients, or derived from considering friction at the bottom surface or vertical diffusion of mass and momentum.

* Load the interactive [shallow water equations model](/sim/?preset=ShallowWaterEqns).

* Click to initiate a wave at a point on the surface, which will reflect off of the boundaries.

A linearized version of this model underlies the Visual Story [Ripples on a Pond](/visual-stories/ripples).

# The World Turning

The simulation above sets $f=0$, representing no influence of the fluid from the [Coriolis force](https://en.wikipedia.org/wiki/Coriolis_force). This force accounts for inertia due to a rotating frame of reference such as in a spinning wave tank or in the Earth's oceans. We can get a sense for how this rotation inflences the fluid flow in a few different ways.

* We first consider an initial condition of a sharp gradient in wave height $h$ in this [dam breaking model](/sim/?preset=ShallowWaterEqnsDamBreaking). Initially we have set $f=0$, but if you instead make it larger (e.g. $f=0.4$ or even $f=1$) and restart the simulation with {{ layout.erase }}, you can see that this force can stabilize the front of the wave after an initial transient. This is a counter-intuitive result indicating that different parts of the ocean can be deeper than others due to Coriolis forces.

* If we instead set $f=1$, and plot the vorticity $\omega=\pd{v}{x}-\pd{u}{y}$ in colour, we can simulate a [model with geostrophically balanced vortices](/sim/?preset=ShallowWaterEqnsVorticalSolitons). Clicking will place such a solution on the domain, which has a positive vorticity inside of it, indicating an anti-clockwise rotation. You can press for longer periods of time to make deeper vortices, and rotate the 3D solution around to see how these look like underneath the surface.

# 1D Solitary Waves

We can also study one-dimensional versions of this model to observe soliton-like traveling waves. This [nonlinear solitary wave model](/sim/?preset=1DShallowWaterEqns) can be compared to a [linearized solitary wave model](/sim/?preset=1DLinearizedShallowWaterEqns), showing qualitatively comparable behaviour but quantitative differences, particularly as the solutions evolve over time.

The simulations on this page came out of discussions with [Matthew Crowe](https://mncrowe.github.io/), who generously provided feedback on constructing this page.
