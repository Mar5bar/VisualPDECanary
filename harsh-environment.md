---
layout: page
title: Get started with the heat equation
permalink: /heat-equation/
---
We'll continue studying the logistic reaction-diffusion model,

$$\pd{u}{t}=\nabla^2 u+ru\left(1-\frac{u}{K}\right),$$

but now consider different boundary conditions.

1. Load the [interactive simulation](https://mar5bar.github.io/mathematics-via-WebGL/reaction_diffusion_generic.html?preset=harshEnvironment). TODO: modify json to initialize with Neumann.

1. Click within the box to visualise an initial population in a 'closed' environment (that is, using Neumann boundary conditions). Unlike the [heat equation](heat-equation), the total mass is not conserved due to the reaction, but instead the system goes to some uniform steady state profile.
