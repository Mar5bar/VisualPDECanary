---
layout: page
title: Dynamic bifurcations with heterogeneity
lesson_number: 120
thumbnail: /assets/images/heterogeneousGiererMeinhardt.png
extract: Isolated patterns and moving spikes
equation: $\pd{u}{t}=\nabla^2 u+a+G(x)+\frac{u^2}{v}-(b+H(x))u$, $\pd{v}{t}=D\nabla^2v+ u^2-cv$
---

This is a brief example of messy boundary conditions and spatial heterogeneity inducing complex dynamical behaviours. We consider a heterogeneous version of the [Gierer-Meinhardt](/mathematical-biology/gierer-meinhardt) model:

$$\begin{aligned}\pd{u}{t}&=\nabla^2 u+a+G(x)+\frac{u^2}{v}-(b+H(x))u,\\ \pd{v}{t}&=D\nabla^2v+ u^2-cv,\end{aligned}$$

where we will vary the domain and boundary conditions, as well as the functions $G,H$, in the examples below. 

* The [interactive simulation](/sim/?preset=GiererMeinhardtIsolating) starts by taking homogeneous Dirichlet boundary conditions for $u$, and homogeneous Neumann boundary conditions for $v$. Despite an initially uniform solution, these boundary conditions are sufficient to perturb the equilibrium to form a patterned state.

* This simulation sets $G = Ax/L$ and $H = Bx/L$, so that taking nonzero values of $A$ and $B$ will lead to spatially heterogeneous forcing. Try setting $A=-1$ or $B=5$ to observe how this leads to size and wavelength differences across the domain.

* With nonzero values of $A$ or $B$, restarting the simulation by pressing {{ layout.erase }} can lead to transient local oscillations and somewhat different selection of where spots will appear.

# 1D Bifurcations

These systems are somewhat simpler to understand in 1D spatial domains, where we can isolate some aspects of their behaviour analytically. In particular, it is known that spike solutions in 1D can move along gradients in spatial heterogeneity, and that this can induces instabilities leading to periodic spike patterns which we now explore.

* First consider [this simulation](/sim/?preset=GMHeterogeneousOscillationsMixedBCs) using the same mixed boundary conditions above, with $G=0$ and $H=Bx/L$. Spikes form across the domain at different amplitudes. The rightmost one undergoes a Hopf instability leading to oscillations in its amplitude, which eventually die out as it moves to the left. Eventually the leftmost spike becomes unstable, making room for the others to move further left. This eventually leads to enough room at the right for a new spike to emerge, which again undergoes a brief oscillatory period before settling down. This behaviour repeats indefinitely. The oscillations at the right, and the boundary spike on the left which does not move, are not terribly relevant for the movement or creation/anhillation of spikes. These are just artifacts of our particular choice of heterogeneity and kinetics.

* We can use Dirichlet conditions to introduce a flux of the inhibitor $v$ at the boundaries to dampen these spike oscillations, as that behaviour is distinct from the movement and creation/anhillation of spikes. We set $v=2$ at the boundaries (retaining the $u=0$ condition from the previous simulation) in [this simulation](/sim/?preset=GMHeterogeneousOscillationsDirichletBCs). This more clearly localizes the spike movement dynamics.

