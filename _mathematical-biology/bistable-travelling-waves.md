---
layout: page
title: "Bistability: invasion and persistence"
# permalink: /bistable-travelling-waves/
lesson_number: 30
thumbnail: /assets/images/bistableTravellingWaves.webp
extract: Spatial Allee effects and changing wavespeeds
equation: $\pd{u}{t}=D\nabla^2 u +u(u-a)(1-u)$
categories: [biology, waves, parabolic]
---


Next we'll consider a bistable reaction--diffusion equation, sometimes referred to as the [Allen--Cahn](https://people.maths.ox.ac.uk/trefethen/pdectb/allen2.pdf) or Chaffee--Infante equation,

$$\pd{u}{t}=D\nabla^2u +u(u-a)(1-u),$$

where $a \in (0,1)$ is a parameter. As with the [Fisher–KPP equation](travelling-wave), this system will admit travelling waves. Here however, one can show that the wavespeed is proportional to

$$
c \propto \int_0^1 u(u-a)(1-u)\, \d u = \frac{1-2a}{12}
$$

and, hence, we expect the waves to change their direction of travel when $a$ crosses the value 0.5. 

* Load the [travelling wave simulation](/sim/?preset=bistableTravellingWave). 

* Click within the box to visualise a 'line' of a population, which will then spread out as a planar wave. 

* The value $a=0.5$ is the threshold between expanding and contracting waves (positive or negative $c$ values). Take values of $a=0.4$, $a=0.6$, and $a=0.5$ to see how this influences the propagation of this wave. 

* You can change the brush to form circular regions (or input directly initial conditions) to see how other geometries of spreading waves are affected by parameter variations in this bistable system.

# Spatial Allee effects

In the above simulations, we considered $a$ near the boundary, and initial waves that had sufficient size. Biologically we are often interested in the question of small invading populations, which becomes complex when both extinction ($u=0$) and persistence ($u=1$) are possible. We'll set $a=0.4$ so that in principle a wave of population can invade the domain, but consider only small initial regions where $u=1$.

* Load the interactive [Allee simulation](/sim/?preset=bistableSurvival). 

* Click within the domain to set the value of $u$ to 1 in some small region. You should notice that the initial population dies out quickly despite $u=1$ being locally stable. Diffusion is spreading the population too quickly.

* The parameter $R$ determines the size of the initial population. Increasing it slightly (e.g. setting $R=6.5$), allows the initial population to grow and overcome this diffusion-induced decay.

* Alternatively, for smaller values of $R$, try pausing the simulation {{ layout.pause }}, painting a larger initial region of $u=1$, and then pressing {{ layout.play }} to set it in motion. You will notice that, for sufficiently large initial regions, the steady state $u=1$ can invade the steady state $u=0$. 

The precise quantities and geometry of these initial conditions can influence persistence. It is difficult to analytically determine conditions for when an invasion is successful or not, as it can depend on both the size and shape of the initial perturbation, as well as the parameters $a$ and $D$. A particular example of this is the [Matano dumbbell given in this simulation](/sim/?preset=bistableSurvivalDumbbell), where the parameter $h$ is the width of the channel between two regions. 

You can explore different values of these parameters and how they influence the success or failure of a population to persist in a new environment. 

# Advection and spatial Allee effects

We can add an advection term to the equation to model movement due to, for example, putting our population in a flowing body of water. The equation now looks like:

$$\pd{u}{t}=D\nabla^2u +u(u-a)(1-u)+V(\cos(\theta)u_x + \sin(\theta)u_y),$$

where $V$ is a velocity and $\theta$ is a direction of advection. 

We implement this in this [advective bistable simulation](/sim/?preset=BistableAdvection), starting near the critical Allee threshold with $a=0.48$. It can be an interesting task to paint an initial condition capable of surviving so close to this boundary to extinction.
