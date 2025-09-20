---
layout: page
title: Growing domains 
lesson_number: 50
thumbnail: /assets/images/Kymograph.webp
extract: Reaction–diffusion patterning on expanding domains
equation: $\pd{u}{t}=\nabla^2 u+u^2v - (a+b)u,$ $\pd{v}{t}=D\nabla^2v -u^2v + a(1 - v)$
categories: [patterns, parabolic]
---
We consider the [Gray-Scott](/_nonlinear-physics/gray-scott) system on apically growing domains (i.e. ones where the growth is localised to the bundary). For an overview of some of the dynamics in such systems, and an inroads to the literature, see [this SIAM dynamical systems web page](https://dsweb.siam.org/Media-Gallery/pattern-formation-on-evolving-domains).


* Check out the [interactive simulation on a linearly growing domain](/sim/?preset=KymographLinearGrowth). By default, the simulation shows a kymograph or space-time plot of the solution $u$ in time and space. You can press {{ layout.views }} to change instead to a 1D plot of the density of $u$ as a function of $x$.

* There is also an [interactive simulation on an exponentially growing domain](/sim/?preset=KymographExponentialGrowth). These simulations are made by using a field $m$ to store the 1D solution in snapshots of $y$, so that the $y$ axis in the kymograph represents the time coordinate. Playing with the domain indicator function, as well as the Overlay submenu under {{ layout.views }} allows you to design your own kymographs for growing or static domains.