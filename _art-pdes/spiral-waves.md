---
layout: page
title: Spiral Waves
lesson_number: 40
thumbnail: /assets/images/spiralWaves.png
extract: Patterns, waves, chaos
equation: $\pd{u}{t}=D_u\nabla^2 u+au-(u+cv)(u^2+v^2)$, $\pd{v}{t}=D_v\nabla^2v+av+(cu-v)(u^2+v^2)$
---

This is a simulation of reaction-diffusion system loosely related to $\lambda$-$\omega$ models of spiral waves, which takes the form:

$$
\begin{aligned}\pd{u}{t}&=D_u\nabla^2 u+au-(u+cv)(u^2+v^2),\\ \pd{v}{t}&=D_v\nabla^2v+av+(cu-v)(u^2+v^2),\end{aligned}
$$

* Load the [interactive simulation](/sim/?preset=lambdaOmega). This plots the solution as the quantity $u^2+v^2$, which evolves from a wave-like initial condition into broken waves which coalesce into spiral waves as the seemingly most stable structures.

* Clicking can perturb these waves, and clicking with dragging can induce new spiral centres (or destroy old ones).

* You can also generate your own waves by setting the initial conditions to zero under <span class='click_sequence'>{{ layout.equations }} → **Initial conditions**</span>, and then clicking to generate radial pulses, or dragging to perturb them.
