---
layout: page
title: Brusselator pattern formation
lesson_number: 60
thumbnail: /assets/images/Brusselator.webp
extract: Turing instability regions
equation: $\pd{u}{t}=\nabla^2 u+a-(b+1)u+u^2v,$ $\pd{v}{t}=D\nabla^2v+ bu-u^2v$
categories: [biology, patterns]
---
Another [Turing](https://en.wikipedia.org/wiki/Turing_pattern) system is the [Brusselator](https://en.wikipedia.org/wiki/Brusselator), given by 

$$\begin{aligned}\pd{u}{t}&=\nabla^2 u+a-(b+1)u+u^2v,\\ \pd{v}{t}&=D\nabla^2v+ bu-u^2v,\end{aligned}$$

where we take $a,b>0$.

* Load the [interactive simulation](/sim/?preset=brusselator). 

* You can change the diffusion coefficients to effectively change the size of the domain (the diffusion coefficients will scale like $1/L^2$ where $L$ is the domain size, so decreasing both of these numbers by a factor of 100 will effectively simulate a domain 10 times larger). As the patterns have approximately fixed wavelengths, this should lead to a different number of pattern elements.

* The homogeneous equilibrium is stable for $b-1<a^2$, and undergoes a Turing instability for $D>a^2/(\sqrt{b}-1)^2$. You can check this condition for the parameters $a=2$, $b=3$, for which the instability threshold is $D_c = a^2/(\sqrt{b}-1)^2 \approx 7.4641$. So we expect patterns for $D=8$, and we expect the system to return to the homogeneous steady state for $D=7$.

# Hyperbolic Brusselator & Turing–Wave instabilities

One can show that two–species reaction–diffusion systems can only ever have Turing–like instabilities with real growth rates. In contrast, hyperbolic reaction–diffusion systems (or systems with more than two species) allow for Turing–Wave (or sometimes Wave or Turing–Hopf) instabilities. Such instabilities lead to spatial eigenfunctions that grow and oscillate, typically giving rise to spatiotemporal dynamics. Here we consider a hyperbolic version of the Brusselator given by

$$\begin{aligned}\tau\pdd{u}{t}+\pd{u}{t}&=D\nabla^2 u+a-(b+1)u+u^2v,\\ \tau\pdd{v}{t}+\pd{v}{t}&=\nabla^2v+ bu-u^2v,\end{aligned}$$

where there are two new terms proportional to $\tau$ and we have instead put the diffusion ratio $D$ on the $u$ equation. The normal Turing instabilities will occur for $D<1$, but new Turing–Wave instabilities may occur for $D>1$, so we set $D=2$.

* In a [one-dimensional simulation](/sim/?preset=BrusselatorTuringWave1D), an initial cosine perturbation on a small domain leads to an oscillating cosine, which is what linear theory would predict. The system loses this instability as $\tau$ is decreased to $0.1$ or below, with a decaying oscillation amplitude for intermediate values.

* On a larger domain, a [two-dimensional simulation](/sim/?preset=BrusselatorTuringWave2D) exhibits a variety of transient dynamics depending on exactly how the uniform equilibrium is perturbed, culminating in `wave–like' spatiotemporal behaviour. Again decreasing $\tau$ or increasing $D$ will reduce the effect of the instability, decreasing the amplitude of the solution.

For more details on such systems and their generalisations, [take a look at this paper](https://arxiv.org/abs/2204.13820).
