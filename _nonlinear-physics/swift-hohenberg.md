---
layout: page
title: Swift–Hohenberg equation
lesson_number: 10
thumbnail: /assets/images/swiftHohenberg.png
extract: Simplistic pattern formation 
equation: $\pd{u}{t}=ru - (1+D\nabla^2)^2u+au^2+bu^3+cu^5$ with periodic boundary conditions
---
Swift–Hohenberg equation:

$$\pd{u}{t} = ru - (k_c^2+\nabla^2)^2u+au^2+bu^3+cu^5,$$

with periodic boundary conditions, and we need $c<0$ (or $b<0$ if $c=0$) for stability.

* Load the [interactive simulation](/sim/?preset=swiftHohenberg). 

* Depending on the signs of $r$, $a$, and $b$, this system can support a wide range of patterns and dynamical behaviour. One important class of behaviour is subcriticality, where the dynamics of the system can become quite complicated and include things like multistability of homogeneous and patterned states, and localised solutions as described below.

# Localised Solutions

When $r<0$, $a>0$, and $b<0$, the system can be in a subcritical regime that supports both stable patterned states and the stable homogeneous state $u=0$. Specific initial conditions can induce localised patterns, which fall off to the background of $u=0$ throughout most of the domain. [Here](/sim/?preset=swiftHohenbergLocalised) is one example, where you can change the initial conditions or click to induce localised structures throughout the domain, but only if they are sufficiently far from the homogeneous state (as otherwise perturbations will decay back to it).

This example is based on this [paper by Dan Hill and collaborators]() which studies symmetric localized solutions of the Swift-Hohenberg equation. The default initial condition picks out a solution with $D_4$ symmetry, and is given by:

$$
(\cos(x-75) - \cos((x-75+\sqrt(3)(y-75))/2) - \cos((x-75-\sqrt(3)(y-75))/2)+\cos(y-75) - \cos((y-75+\sqrt(3)(x-75))/2) - \cos((y-75-\sqrt(3)(x-75))/2))\exp(-\sqrt(0.28)\sqrt((x-75)^2+(y-75)^2)/5).
$$

Another very pretty solution involves swapping some of the $\cos$ terms for $-\cos$, leading to a solution with $D_{12}$ symmetry. The full initial condition reads:

$$
(\cos(x-75) + \cos((x-75+\sqrt(3)(y-75))/2) + \cos((x-75-\sqrt(3)(y-75))/2)+\cos(y-75) + \cos((y-75+\sqrt(3)(x-75))/2) + \cos((y-75-\sqrt(3)(x-75))/2))\exp(-\sqrt(0.28)\sqrt((x-75)^2+(y-75)^2)/5).
$$

Lastly, we can obtain a pattern with hexagonal symmetry via the initial condition:

$$
(\cos(x-75) + \cos((x-75+\sqrt(3)(y-75))/2) + \cos((x-75-\sqrt(3)(y-75))/2))\exp(-\sqrt(0.28)\sqrt((x-75)^2+(y-75)^2)/5).
$$
