---
layout: page
title: "The method of images"
lesson_number: 20
thumbnail: /assets/images/methodOfImages.webp
extract: Boundaries in potential flow
equation: $\nabla^2 \phi = 0,$ $(u,v) = \vnabla \phi$
categories: [fluids, elliptic]
---

When studying fluid flows, it is often easiest to consider unbounded domains. In real life, however, boundaries inevitably come into play and we have to enforce appropriate boundary conditions. Doing so can be tricky in general.

For certain types of flows and certain boundary conditions, the titular [method of images](https://en.wikipedia.org/wiki/Method_of_images) allows to do this analytically. It is also used for studying electrostatics, whose governing equations resemble those of [potential flow](https://en.wikipedia.org/wiki/Potential_flow).

# Equations of potential flow

Potential flows in 2D with velocity field $(u,v)$ are governed by the Laplace equation

$$\nabla^2 \phi = 0$$

for velocity potential $\phi$, from which we define $u = \pd{\phi}{x}$ and $v=\pd{\phi}{y}$.

We'll explore these flows in the half space $x>0$, applying a no-flux boundary condition $u=0$ on the boundary $x=0$. This common condition ensures that no fluid passes through the boundary.

# Sources and symmetry

Suppose we wanted to compute the flow due to a point source in the fluid in this domain, which amounts to solving the singulary forced Poisson equation

$$\nabla^2 \phi = -\delta(x-x_S,y-y_S)$$

in the half space $x>0$, with $\phi_x=0$ on $x=0$. Here, $\delta$ is the [Dirac delta function](https://en.wikipedia.org/wiki/Dirac_delta_function) and $(x_S,y_S)$ are the coordinates of the source. We've set up such a source in this [interactive simulation](/sim/?preset=potentialFlowHalfSpace), and drawn on the (currently fictitious) boundary in white.

The method of images tells us that we can prevent flow through the boundary by including an additional source outside of the domain (i.e. in $x<0$). This is only possible because the equation for $\phi$ is linear.

- Try clicking to put down a source of equation strength. Can you find out where it should go?

- Test your solution by switching to a true half space by toggling on a custom domain in <span class='click_sequence'>{{ layout.settings }} → **Domain**</span> How close can you get?

# Numerical notes

In these simulations, we're not actually solving the Poisson equation directly. Instead, we're solving a parabolic version that converges (in time) to a solution of the original equation. Thus, any time dependence that you see in these simulations is actually the solver converging to the true solution - we think this is pretty neat!
