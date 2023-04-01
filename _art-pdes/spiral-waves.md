---
layout: page
title: Spiral Waves
lesson_number: 20
thumbnail: /assets/images/spiralWaves.png
extract: Patterns, waves, chaos
equation: $\pd{u}{t}=D_u\nabla^2 u+au-(u+cv)(u^2+v^2)$, $\pd{v}{t}=D_v\nabla^2v+av+(cu-v)(u^2+v^2)$
---

This is a simulation of reaction-diffusion system loosely related to $\lambda$-$\omega$ models of spiral waves, which takes the form:

$$
\begin{aligned}\pd{u}{t}&=D_u\nabla^2 u+au-(u+cv)(u^2+v^2),\\ \pd{v}{t}&=D_v\nabla^2v+av+(cu-v)(u^2+v^2),\end{aligned}
$$

* Load the [interactive simulation](/sim/?preset=lambdaOmega). This plots the solution as the quantity $u^2+v^2$, which evolves from a wave-like initial condition into broken waves which coalesce into spiral waves as the seemingly most stable structures.