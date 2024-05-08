---
layout: page
title: "Shallow water equations"
# permalink: /shallow-water/
lesson_number: 130
thumbnail: /assets/images/shallow-water-waves.webp
extract: Water waves and ripples
equation: $\pd{h}{t} = - \left( \pd{u}{x\v{y}} + \pd{v}{y\v{y}}\right) \left(h+H_{e}\right)-\left( \pd{h}{x\v{y}} u+ \pd{h}{y\v{y}} v\right)$
---


# Stochastic pattern formation

We consider a form of the [shallow water equations](https://en.wikipedia.org/wiki/Shallow_water_equations) given by

$$\begin{aligned}
      \pd{h}{t} &= - \left(\textstyle \pd{u}{x\v{y}} +  \pd{v}{y\v{y}}\right) \left(h+H_{e}\right)-\left( \pd{h}{x\v{y}} u+ \pd{h}{y\v{y}} v\right)-\varepsilon h\\
      \pd{u}{t} &= \nu \lap u -g \pd{h}{x\v{y}} - k u-u  \pd{u}{x\v{y}}+f v\\
      \pd{v}{t} &= \nu \lap v -g  \pd{h}{y\v{y}} - k v-v  \pd{v}{x\v{y}}-f u
    \end{aligned}$$
where $h$ is is the water height, $u$ and $v$ are the fluid velocities in $x$ and $y$ directions, and all of the parameters are as described in the article linked above except for H_e$ replacing the mean height of the surface $H$, and the term involving $\varepsilon$ representing a weak dissipation of the wave height $h$.

* Load the interactive [shallow water equations model](/sim/?preset=ShallowWaterEqns).

* Click to initiate a wave at a point on the surface, which will reflect off of the boundaries.

* The simulation above considers no Coriolis force. If we instead set $f=1$, and plot the vorticity $\pd{v}{x}-\pd{u}{y}$ in colour, we can simulate a [model with vortical solitons]((/sim/?preset=ShallowWaterEqnsVorticalSolitons).) Clicking will place such a solution on the domain, which will slowly decay over time.

A linearized version of this model underlies the Visual Story [Ripples on a Pond](/visual-stories/ripples).

# 1D Solitary Waves

We can also study one-dimensional versions of this model to observe soliton-like traveling waves. This [nonlinear solitary wave model](/sim/?preset=1DShallowWaterEqns) can be compared to a [linearized solitary wave model](/sim/?preset=1DShallowWaterEqns), showing qualitatively comparable behaviour but quantitative differences, particularly as the solutions evolve over time.
