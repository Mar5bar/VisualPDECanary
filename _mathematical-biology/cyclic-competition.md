---
layout: page
title: Cyclic competition models
lesson_number: 110
thumbnail: /assets/images/rock-paper-scissors.webp
extract: Rock, paper, scissors – spiral waves!
equation: $\pd{u}{t}=D_u\nabla^2 u+u(1-u-av-bw)$ $\pd{v}{t}=D_v\nabla^2 v+v(1-bu-v-aw)$ $\pd{w}{t}=D_w\nabla^2 w+w(1-au-bv-w)$
categories: [biology, waves, chaos]
---

We now consider an example of a reaction-diffusion system based on the following reaction kinetics:

$$\begin{aligned}\pd{u}{t}&=D_u\nabla^2 u+u(1-u-av-bw),\\ \pd{v}{t}&=D_v\nabla^2 v+v(1-bu-v-aw),\\ \pd{w}{t}&=D_w\nabla^2 w+w(1-au-bv-w).\end{aligned}$$

These are an example of a [generalised Lotka–Volterra](https://stefanoallesina.github.io/Sao_Paulo_School/intro.html) system. If we set $a < 1 < b$, then each population outcompetes another, and hence their relative fitness forms a cycle. This kind of model is also known as a spatial rock-paper-scissors game. 

To make things more interesting, we will allow the species to diffuse at different rates.

* Load the [interactive simulation](/sim/?preset=cyclicCompetition)
  
* This begins with an initially structured population that eventually devolves into a complex spatiotemporal motion, with spiral waves a dominant feature.

* This system exhibits a wide range of behaviours. One of the most interesting is that if you allow spiral waves to form, and then set all diffusion coefficients to be equal (e.g. by changing $D_u$ to $0.5$), the system will still admit spiral waves despite not having a Turing-like instability.
