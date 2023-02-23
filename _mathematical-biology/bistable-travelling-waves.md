---
layout: page
title: Bistable travelling waves
# permalink: /bistable-travelling-waves/
lesson_number: 30
thumbnail: /assets/images/travelling-waves.png
extract: Bistability affects waves!
equation: $\pd{u}{t}=D\nabla^2 +u(u-a)(u-1)$
---


Next we'll consider a bistable reaction-diffusion equation, sometimes referred to as the [Allen-Cahn]([https://people.maths.ox.ac.uk/trefethen/pdectb/allen2.pdf](https://people.maths.ox.ac.uk/trefethen/pdectb/allen2.pdf)) or Chaffee-Infante equation,

$$\pd{u}{t}=D\nabla^2 +u(u-a)(u-1),$$

where $a \in (0,1)$ is a parameter. As with the Fisher equation, this system will admit travelling waves. Here however, one can show that the wavespeed is propirtional to,

$$
c \propto \int_0^1 u(u-a)(u-1)du = \frac{2a-1}{12},
$$

and hence we expect the waves to change their direction of travel when $a$ crosses the value $0.5$. 

1. Load the [interactive simulation](/sim/?preset=bistableTravellingWave). 

1. Click within the box to visualise a 'line' of a population, which will then spread out as a planar wave. 

1. Take values of $a=0.4$, $a=0.6$, and $a=0.5$ to see how this influences the propogation of this wave.
