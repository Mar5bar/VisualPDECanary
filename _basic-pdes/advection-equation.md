---
layout: page
title: Convection-Diffusion
lesson_number: 70
thumbnail: /assets/images/AdvectionEquation.png
extract: Movement along streamlines
equation: $\pd{u}{t}=D \nabla^2 u-\v{v}\cdot \vnabla u$
---
We now look at the [advection equation](https://en.wikipedia.org/wiki/Advection#The_advection_equation) with diffusion (also known as the [convection-diffusion equation](https://en.wikipedia.org/wiki/Convection%E2%80%93diffusion_equation), or sometimes the dampest one-way wave equation). This takes the form,

$$\pd{u}{t}=D \nabla^2 u-\v{v}\cdot \vnabla u,$$

where we consider two forms of the advection/drift velocity $\v{v}$: 

$$
\v{v} = V(y,-x),
$$
or 
$$
\v{v} = V(\cos(\theta),\sin(\theta)),
$$
where $\theta$ is a parameter

The first of these expressions is a rotational velocity field about the centre of the domain, whereas the second is linear (unidirectional) advection in the direction $\theta$. 

* Load the [interactive simulation](/sim/?preset=AdvectionEquation). By default it uses the rotating velocity case with Neumann boundary conditions.

* Clicking in the domain introduces some amount of mass which diffuses and advects along the rotating vector field. Importantly, Neumann boundary conditions will not conserve mass, and so you may see odd effects near the edges of the domain.

* Changing the value of $V$ will change the speed of the rotation, though $V$ much larger than the initial value may lead to bad solutions (see the Numerical Notes below).

* Now, if you change the parameter $Q$ from $Q=2$ to $Q=1$, this will change the form of advection to be the unidirectional one, with movement in a given direction given by the parameter $\theta$. You may need to increase $V$ to see this movement more clearly.

* The unidirectional advection is less sensitive to boundary conditions, so these can be changed to Periodic to observe advection over effectively larger regions of space.

## Numerical Notes

First-order derivatives are in general harder to deal with numerically for a variety of reasons, and in particular models involving them can depend more subtly on details such as smoothness of initial conditions. In this example, we are using a different form of the brush, which can be found under <span class='click_sequence'>{{ layout.settings }} → **Brush**</span> This adds some smoothing to the boundaries of the bump each time the screen is clicked. This is important to reduce spurious oscillations due to the first derivative terms.
