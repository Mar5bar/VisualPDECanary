---
layout: page
title: Brusselator pattern formation
lesson_number: 60
thumbnail: /assets/images/Brusselator.webp
extract: Turing instability regions
equation: $\pd{u}{t}=\nabla^2 u+a-(b+1)u+u^2v$, $\pd{v}{t}=D\nabla^2v+ bu-u^2v$
---
Another [Turing](https://en.wikipedia.org/wiki/Turing_pattern) system is the [Brusselator](https://en.wikipedia.org/wiki/Brusselator), given by 

$$\begin{aligned}\pd{u}{t}&=\nabla^2 u+a-(b+1)u+u^2v,\\ \pd{v}{t}&=D\nabla^2v+ bu-u^2v,\end{aligned}$$

where we take $a,b>0$.

* Load the [interactive simulation](/sim/?preset=brusselator). 

* You can change the diffusion coefficients to effectively change the size of the domain (the diffusion coefficients will scale like $1/L^2$ where $L$ is the domain size, so decreasing both of these numbers by a factor of 100 will effectively simulate a domain 10 times larger). As the patterns have approximately fixed wavelengths, this should lead to a different number of pattern elements.

* The homogeneous equilibrium is stable for $b-1<a^2$, and undergoes a Turing instability for $D>a^2/(\sqrt{b}-1)^2$. You can check this condition for the parameters $a=2$, $b=3$, for which the instability threshold is $D_c = a^2/(\sqrt{b}-1)^2 \approx 7.4641$. So we expect patterns for $D=8$, and we expect the system to return to the homogeneous steady state for $D=7$.
