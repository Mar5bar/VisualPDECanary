---
layout: page
title: Brusselator Pattern Formation
lesson_number: 60
thumbnail: /assets/images/brusselator.PNG
extract: Turing instability regions
equation: $\pd{u}{t}=\nabla^2 u+a-(b+1)u+u^2v, \,\, \pd{u}{t}=D\nabla^2 bu-u^2v,$
---
Another [Turing](https://en.wikipedia.org/wiki/Turing_pattern) system is the [Brusselator](https://en.wikipedia.org/wiki/Brusselator), given by 

$$\pd{u}{t}=\nabla^2 u+a-(b+1)u+u^2v, \quad \pd{u}{t}=D\nabla^2 bu-u^2v,$$

where we take $a,b>0$.

1. Load the [interactive simulation](/sim/?preset=Schnakenberg). 

FIX BELOW

1. You can change the diffusion coefficients to effectively change the size of the domain (the diffusion coefficients will scale like $1/L^2$ where $L$ is the domain size, so decreasing both of these numbers by $100$ will effectively simulate a domain $10$ times larger). As the patterns have approximately fixed-wavelengths, this should lead to a different number of pattern elements.

1. With $D=100$, the system forms spot-like patterns. If you reduce to $D=30$, instead stripe-like patterns will be formed. *Note:* In this simulation, the color scale is automatically changed to match the highest/lowest value of the function $u$. You can disable this under "Colour->Auto snap?" if you'd like to quantitatively compare solutions. Note as well that this will be badly behaved when $u$ is approximately constant.

1. The homogeneous equilibrium can undergo Hopf bifurcations for small values of $1 > b > a \geq 0$. In this regime, one can find Turing patterns, homogeneous oscillations, and complex spatiotemporal interactions of Turing and Hopf instabilities. One example is this simulation [interactive simulation](/sim/?preset=SchnakenbergHopf), but you can find others by tweaking the parameters.
