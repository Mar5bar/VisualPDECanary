---
layout: page
title: Gierer–Meinhardt pattern formation
lesson_number: 70
thumbnail: /assets/images/GiererMeinhardt.webp
extract: Spots and stripes
equation: $\pd{u}{t}=\nabla^2 u+a+\frac{u^2}{v}-bu,$ $\pd{v}{t}=D\nabla^2v+ u^2-cv$
categories: [biology, patterns]
---
Another [Turing](https://en.wikipedia.org/wiki/Turing_pattern) system is the [Gierer–Meinhardt model](https://www.scholarpedia.org/article/Gierer-Meinhardt_model), given by 

$$\begin{aligned}\pd{u}{t}&=\nabla^2 u+a+\frac{u^2}{v}-bu,\\ \pd{v}{t}&=D\nabla^2v+ u^2-cv,\end{aligned}$$

where we take $a,b,c>0$ and $D>1$.

* Load the [interactive simulation](/sim/?preset=GiererMeinhardt)

* Changing any of the parameters can lead to different solutions, though this system generically favours spot-like patterns.

Note that the colour scale here is fixed, but that changing parameters will lead to solutions with different maxima and minima, so using the auto-snap feature under <span class='click_sequence'>{{ layout.settings }} → **Colour** → **Auto snap**</span> may be advised.

# Stripes stability

We can observe the instability of stripe patterns in this model by choosing initial conditions which become stripes along one direction. We set

$$
u(0,x,y) = 1+\cos\left(\frac{n\pi x}{L}\right), \quad v(0,x,y) = 1,
$$

with $n$ an integer. 

* Load the [simulation](/sim/?preset=GiererMeinhardtStripeICs)

* Change the value of $n$ and restart the simulation by pressing {{ layout.erase }}. In each case a different number of initial stripes will evolve into some number of stripes, but they should persist indefinitely.

* Now click on or near a stripe to destabilise it into spots. Note that the brush value, found in <span class='click_sequence'>{{ layout.settings }} → **Brush**</span> is set to $1.01u$, so that it is a relatively small perturbation of the current solution. 

# Saturation leads to stripes

A common way to obtain stripe-like patterns in this model is to consider saturation of the self-activation term ($u^2/v$ in the equation above). In this case we have the model

$$\begin{aligned}\pd{u}{t}&=\nabla^2 u+a+\frac{u^2}{v(1+Ku^2)}-bu,\\ \pd{v}{t}&=D\nabla^2v+ u^2-cv,\end{aligned}$$

where $K>0$ is a saturation constant. 

For very large values of $K$, the system will not admit Turing patterns, and for very small values it will behave as in the above spot-forming model. However, for intermediate values of $K$ one can get labyrinthine patterns.

* Observe the patterns in this [stripey simulation](/sim/?preset=GiererMeinhardtStripes)
* Try increasing or decreasing the size of $K$ to observe how this influences spot/stripe selection in the system. Note that the colour scale is changing to match solution maxima and minima.
