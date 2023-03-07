---
layout: page
title: Reaction–cross-diffusion systems
lesson_number: 100
thumbnail: /assets/images/KellerSegel.PNG
extract: Extended Turing spaces
equation: $\pd{u}{t}=\nabla\cdot(D_{uu}\nabla u+D_{uv}\nabla v)+f(u,v)$, $\pd{v}{t}=\nabla\cdot(D_{vu}\nabla u+D_{vv}\nabla v)+g(u,v)$
---
IGNORE THIS PAGE - CURRENTLY IN PROGRESS BEING BUILT!

We now consider an example of a cross-diffusion system based on the following reaction kinetics:

$$\begin{aligned}\pd{u}{t}&=\nabla\cdot(D_{uu}\nabla u+D_{uv}\nabla v)+f(u,v),\\ \pd{v}{t}&=\nabla\cdot(D_{vu}\nabla u+D_{vv}\nabla v)+pu^2+u^2v-v/(q+v).\end{aligned}$$

* Load the [interactive simulation](/sim/?preset=CrossDiffusion). 


# Spiral wave patterns

* Next we consider the reaction kinetics:

$$ f(u,v) = r-pu^2+u^2v, \quad g(u,v) = pu^2+u^2v-\frac{v}{q+v}.$$
