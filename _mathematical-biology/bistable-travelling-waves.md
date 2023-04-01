---
layout: page
title: Bistability: Invasion and Persistence
# permalink: /bistable-travelling-waves/
lesson_number: 30
thumbnail: /assets/images/travelling-waves.png
extract: Spatial Allee effects and changing wavespeeds
equation: $\pd{u}{t}=D\nabla^2 u +u(u-a)(u-1)$
---


Next we'll consider a bistable reaction--diffusion equation, sometimes referred to as the [Allen--Cahn]([https://people.maths.ox.ac.uk/trefethen/pdectb/allen2.pdf](https://people.maths.ox.ac.uk/trefethen/pdectb/allen2.pdf)) or Chaffee--Infante equation,

$$\pd{u}{t}=D\nabla^2u +u(u-a)(u-1),$$

where $a \in (0,1)$ is a parameter. As with the Fisher equation, this system will admit travelling waves. Here however, one can show that the wavespeed is proportional to

$$
c \propto \int_0^1 u(u-a)(u-1)\, \d u = \frac{2a-1}{12},
$$

and hence we expect the waves to change their direction of travel when $a$ crosses the value 0.5. 

* Load the [interactive simulation](/sim/?preset=bistableTravellingWave). 

* Click within the box to visualise a 'line' of a population, which will then spread out as a planar wave. 

* The value $a=0.5$ is the threshold between expanding and contracting waves (positive or negative $c$ values). Take values of $a=0.4$, $a=0.6$, and $a=0.5$ to see how this influences the propogation of this wave. 

* You can change the brush to form circular regions (or input directly initial conditions) to see how other geometries of spreading waves are affected by parameter variations in this bistable system.

# Spatial Allee Effects

In the above simulations, we considered $a$ near the boundary, and initial waves which had sufficient size. Biologically we are often interested in the question of small invading populations, which becomes complex when both extinction ($u=0$) and persistence ($u=1$) are possible. We'll set $a=0.4$ so that in principle a wave of population can invade the domain, but consider only small initial regions where $u=1$.

1. Load the [interactive simulation](/sim/?preset=bistableSurvival). 

1. Click within the domain to set the value of $u$ to 1 in some small region. You should notice that the initial population dies out quickly despite $u=1$ being locally stable. Diffusion is spreading the population too quickly.

1. Try pausing the simulation {{ layout.pause }}, painting a larger initial region of $u=1$, and then pressing {{ layout.play }} to set it in motion. You will notice that, for sufficiently large initial regions, the steady state $u=1$ can invade the steady state $u=0$. 

1. It is difficult to analytically determine conditions for when an invasion is successful or not, as it can depend on both the size and shape of the perturbation, as well as the parameters $a$ and $D$. You can explore different values of these parameters and how they influence the success or failure of a population to persist in a new environment. 
