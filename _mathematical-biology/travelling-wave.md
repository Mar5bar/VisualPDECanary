---
layout: page
title: Logistic travelling waves
lesson_number: 10
thumbnail: /assets/images/travelling-waves.png
extract: Diffusion plus logistic? What could go wrong? 
equation: $\pd{u}{t}=\nabla^2 u+ru\left(1-\frac{u}{K}\right)$ with periodic boundary conditions
---
Next we'll consider a classical reaction–diffusion equation, with a logistic nonlinearity. This is often referred to as the [Fisher–KPP equation](https://en.wikipedia.org/wiki/Fisher%27s_equation),

$$\pd{u}{t}=\nabla^2 u+ru\left(1-\frac{u}{K}\right),$$

with periodic boundary conditions.

1. Load the [interactive simulation](/sim/?preset=travellingWave). 

1. Click within the box to visualise a 'line' of a population, which will then spread out as a planar wave. 

1. Explore different parameters in this model, namely $D$, $r$, and $K$. 
 
1. Does the wave speed, $c$, approximately follow the scaling law derived via linearisation of the wavefront (that is, $c \propto \sqrt{rD}$)? One interesting experiment to try is to see what happens if you simultaneously decrease $r$ and increase $D$ (or vice versa). This should have (approximately) the same effective wave speed, but the profile will be different as you have effectively changed the time and space scales in opposite directions.

1. Does the value of the carrying capacity, $K$, matter for the speed of the wave? Or the profile?

1. Next change the brush type to a circle and explore how circular waves travel. These are similar to the planar (effectively 1D) waves above, but their speed will be slightly different as the curvature of these wave fronts will influence their speed.
