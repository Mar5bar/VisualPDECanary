---
layout: page
title: Survival in a harsh environment
permalink: /harsh-environment/
---
We'll continue studying the logistic reaction-diffusion model,

$$\pd{u}{t}=D\nabla^2 u+ru\left(1-\frac{u}{K}\right),$$

but now consider different boundary conditions.

1. Load the [interactive simulation](/sim/?preset=harshEnvironment). TODO: modify json to initialize with Neumann.

1. Click within the box to visualise an initial population in a 'closed' environment (that is, using Neumann boundary conditions). Unlike the [heat equation](heat-equation), the total mass is not conserved due to the reaction, but instead the system goes to some uniform steady state profile.
