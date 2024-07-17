---
layout: page
title: Schnakenberg pattern formation
lesson_number: 50
thumbnail: /assets/images/Schnakenberg.webp
extract: Spots and stripes
equation: $\pd{u}{t}=\nabla^2 u+a-u+u^2v,$ $\pd{v}{t}=D\nabla^2v+ b-u^2v$
categories: [biology, patterns, parabolic]
---
Next we'll consider a classical reaction–diffusion system which forms [Turing patterns](https://en.wikipedia.org/wiki/Turing_pattern),

$$\begin{aligned}\pd{u}{t}&=\nabla^2 u+a-u+u^2v,\\ \pd{v}{t}&=D\nabla^2v+ b-u^2v,\end{aligned}$$

where we need $D>1$ to form patterns, and typically take $a,b>0$.

* Load the [Schnakenberg simulation](/sim/?preset=Schnakenberg)

* Click within the box to visualise a pulse of a population, which will then spread out as a planar wave leaving patterns behind it. 

* You can change the diffusion coefficients to effectively change the size of the domain (the diffusion coefficients will scale like $1/L^2$ where $L$ is the domain size, so decreasing both diffusion coefficients by $100$ will effectively simulate a domain $10$ times larger). As the patterns have approximately fixed wavelengths, this should lead to a different number of pattern elements.

* With $D=100$, the system forms spot-like patterns. If you reduce to $D=30$, instead stripe-like patterns will be formed. 

* The homogeneous equilibrium can undergo Hopf bifurcations for small values of $1 > b > a \geq 0$. In this regime, one can find Turing patterns, homogeneous oscillations, and complex spatiotemporal interactions of Turing and Hopf instabilities. One example is this [interactive simulation](/sim/?preset=SchnakenbergHopf), but you can find others by tweaking the parameters.

* Check out this [growing simulation](/sim/?preset=SchnakenbergGrowingDisk) for a crude implementation of the Schnakenberg system on a growing domain with Dirichlet boundary conditions.
