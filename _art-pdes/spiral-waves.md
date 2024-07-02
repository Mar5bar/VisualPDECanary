---
layout: page
title: Spiral waves
lesson_number: 40
thumbnail: /assets/images/spiralWaves.webp
extract: You spin me right ’round, baby
equation: $\pd{u}{t}=D_u\nabla^2 u+au-(u+cv)(u^2+v^2),$ $\pd{v}{t}=D_v\nabla^2v+av+(cu-v)(u^2+v^2)$
categories: [art]
---

This is a simulation of a reaction–diffusion system loosely related to $\lambda$-$\omega$ models of spiral waves, which takes the form:

$$
\begin{aligned}\pd{u}{t}&=D_u\nabla^2 u+au-(u+cv)(u^2+v^2),\\ \pd{v}{t}&=D_v\nabla^2v+av+(cu-v)(u^2+v^2),\end{aligned}
$$

* Load the [interactive simulation](/sim/?preset=lambdaOmega). This plots the solution as the quantity $u^2+v^2$, which evolves from a wave-like initial condition into broken waves which coalesce into spiral waves as the seemingly most stable structures.

* Clicking can perturb these waves, and clicking with dragging can induce new spiral centres (or destroy old ones).

* You can also generate your own waves by setting the initial conditions to zero under {{ layout.equations }} → **Initial conditions**, and then clicking to generate radial pulses, or dragging to perturb them.
