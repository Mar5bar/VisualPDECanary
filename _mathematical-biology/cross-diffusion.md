---
layout: page
title: Reaction–cross-diffusion systems
lesson_number: 100
thumbnail: /assets/images/KellerSegel.PNG
extract: Extended Turing spaces
equation: $\pd{u}{t}=\vnabla\cdot(D_{uu}\vnabla u+D_{uv}\vnabla v)+a-u+u^2v,$ $\pd{v}{t}=\vnabla\cdot(D_{vu}\vnabla u+D_{vv}\vnabla v)+b-u^2v$
---

We now consider an example of a cross-diffusion system based on the following reaction kinetics:

$$\begin{aligned}\pd{u}{t}&=\vnabla\cdot(D_{uu}\vnabla u+D_{uv}\vnabla v)+a-u+u^2v,\\ \pd{v}{t}&=\vnabla\cdot(D_{vu}\vnabla u+D_{vv}\vnabla v)+b-u^2v,\end{aligned}$$

which is a cross-diffusion version of the [Schnakenberg](/mathematical-biology/schnakenberg).

* Load the [interactive simulation](/sim/?preset=crossDiffusionSchnakenberg). 

* The default parameters create localized inverted spots (sometimes called "dark solitons") wherever the perturbation is, but these do not seem to propagate patterns in any direction. 

* Setting the value of $b=1$ gives pattern formation closer to the Schnakenberg system observed before, though note that the self-diffusion terms are equal.

* Finally taking $b=0.1$ allows for spatiotemporal behaviors, as the homogeneous equilibrium is then well into a Hopf regime.


