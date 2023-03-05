---
layout: page
title: FitzHugh-Nagumo and Excitability
lesson_number: 80
thumbnail: /assets/images/FitzHugh-Nagumo.PNG
extract: Patterns, spiral waves, and chaos
equation: $\pd{u}{t}=\nabla^2 u+u +u-u^3-v$, $\pd{u}{t}=D\nabla^2v+ \varepsilon_v(u-a_v v-a_z)$
---
Here we look at the  [FitzHugh-Nagumo model](https://en.wikipedia.org/wiki/FitzHugh%E2%80%93Nagumo_model), given by 

$$\begin{aligned}\pd{u}{t}&=\nabla^2 u+u +u-u^3-v,\\ \pd{v}{t}&=D\nabla^2v+ \varepsilon_v(u-a_v v-a_z),\end{aligned}$$

where we take $a,b,c>0$ and $D>1$.

* Load the [interactive simulation](/sim/?preset=FitzHugh-Nagumo). 

* Click in the domain to initiate a pattern-forming instability, which will form roughly concentric rings as it expands.

* This system has many different kinds of solutions which are stable over long time periods. To see this, change the initial condition (under 'Misc' on the right) so that $u$ has the value 'RAND'. Then press 'r' to reset the simulation. It should now exhibit patterns which are much more spot-like.

# Turing-Hopf 

We now vary the parameters from the previous simulation so that it supports both pattern formation, but also oscillations. These oscillations come from steady states undergoing [Hopf bifurcations](https://en.wikipedia.org/wiki/Hopf_bifurcation). In such regimes, one can often find a range of complex spatial, temporal, and spatiotemporal behaviours, many of which can be simultaneously stable for different initial conditions etc. To illustrate this, we consider the initial conditions,

$$
u(x,y,0) = \cos(m x \pi/L)\cos(m y \pi/L), \quad v(x,y,0)=0,
$$

for some integer $m$ and domain length $L=280$. This simulation is shown [here](/sim/?preset=FitzHugh-Nagumo-Hopf), and can display long-time solutions that exhibit all three kinds of behaviour, depending on the values of $m$, $D$, and the other parameters. Try $m=4$, $m=3$, and $m=6$ for example.

# Three-species variant

A three-species variant of the FHN model is of the form,

$$\begin{aligned}\pd{u}{t}&=\nabla^2 u +u-u^3-v,\\ \pd{v}{t}&=D_v\nabla^2v+ \varepsilon_v(u-a_v v-a_w w-a_z)\\ \pd{w}{t}&=D_w\nabla^2w+ \varepsilon_w(u-w).\end{aligned}$$

* An [interactive simulation](/sim/?preset=FitzHugh-Nagumo-3) demonstrates the dynamics of this system in a regime which has both homogeneous limit cycles and pattern formation competing against one another.

* The initial pattern formed in this simulation will eventually be destroyed by the oscillations. You can increase the value of $a_v$ to stabilize the pattern for longer, and if $a_v=0.1$, the pattern will eventually overtake the oscillations and fill the entire domain.
