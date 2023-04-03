---
layout: page
title: Cyclic competition models
lesson_number: 110
thumbnail: /assets/images/squirrel.png
extract: Rock, paper, scissors – spiral waves!
equation: $\pd{u}{t}=\nabla^2 u+u(1-u-av-bw)$ $\pd{v}{t}=\nabla^2 v+v(1-bu-v-aw)$ $\pd{w}{t}=\nabla^2 w+w(1-au-bv-w)$
---

We now consider an example of a cross-diffusion system based on the following reaction kinetics:

$$\begin{aligned}\pd{u}{t}&=\nabla^2 u+u(1-u-av-bw),\\ \pd{v}{t}&=\nabla^2 v+v(1-bu-v-aw),\\ \pd{w}{t}&=\nabla^2 w+w(1-au-bv-w).\end{aligned}$$

These are an example of a [generalised Lotka–Volterra](https://stefanoallesina.github.io/Sao_Paulo_School/intro.html) system. If we set $a < 1 < b$, then each population outcompetes another, and hence their relative fitness forms a cycle. This kind of model is also known as a spatial rock-paper-scissors game. To make things more interesting, we will allow the species to diffuse at different rates.

* Load the [interactive simulation](/sim/?preset=cyclicCompetition)
* This begins with an initial wave of population, which eventually devolves into a complex spatiotemporal motion, with spiral waves a dominant feature.
