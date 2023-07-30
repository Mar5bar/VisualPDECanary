---
layout: page
title: Hyperbolic Reaction-Diffusion Systems
lesson_number: 100
thumbnail: /assets/images/FHNTuringWave.webp
extract: Turing-Wave instabilities
equation: $\tau\pdd{u}{t}+\pd{u}{t}=D_u\nabla^2 u+f(u,v)$, $\tau\pdd{v}{t}+\pd{v}{t}=D_v\nabla^2v+ g(u,v)$
---

One can show that two–species reaction–diffusion systems can only ever have Turing–like instabilities with real growth rates. In contrast, hyperbolic reaction–diffusion systems (or systems with more than two species) allow for Turing–Wave (or sometimes Wave or Turing–Hopf) instabilities. Such instabilities lead to spatial eigenfunctions that grow and oscillate, typically giving rise to spatiotemporal dynamics. Here we consider a hyperbolic version of the [Brusselator](/mathematical-biology/brusselator) given by

$$\begin{aligned}\tau\pdd{u}{t}+\pd{u}{t}&=D_u\nabla^2 u+a-(b+1)u+u^2v,\\ \tau\pdd{v}{t}+\pd{v}{t}&=D_v\nabla^2v+ bu-u^2v,\end{aligned}$$

where there are two new terms proportional to $\tau$. The normal Turing instabilities will occur for $D_u<D_v$, but new Turing–Wave instabilities may occur for $D_u>D_v$, so we set $D_u=D=2$ and $D_v=1$.

* In a [one-dimensional simulation](/sim/?preset=BrusselatorTuringWave1D), an initial cosine perturbation on a small domain leads to an oscillating cosine, which is what linear theory would predict. The system loses this instability as $\tau$ is decreased to $0.1$ or below, with a decaying oscillation amplitude for intermediate values.

* On a larger domain, a [two-dimensional simulation](/sim/?preset=BrusselatorTuringWave2D) exhibits a variety of transient dynamics depending on exactly how the uniform equilibrium is perturbed, culminating in `wave–like' spatiotemporal behaviour. Again decreasing $\tau$ or increasing $D$ will reduce the effect of the instability, decreasing the amplitude of the solution.

* Here is a [different 1D example](/sim/?preset=TuringWaveFHN) and the [same system in 2D](/sim/?preset=TuringWaveFHN2D) based on the [FitzHugh-Nagumo system](/mathematical-biology/fitzhugh-nagumo). 

For more details on such systems and their generalisations, take a look at [this paper](https://arxiv.org/abs/2204.13820).
