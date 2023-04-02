---
layout: page
title: Nonlinear Schrödinger/Complex Ginzburg-Landau
lesson_number: 20
thumbnail: /assets/images/complexGinzburgLandau.png
extract: Phase separation
equation: $\pd{u}{t}=-\nabla^2u-\nabla^4u-|\nabla u| $
---
Here is an implementation of a [(complex) Ginzburg-Landau equation](https://arxiv.org/abs/cond-mat/0106115) given by:

$$\pd{\psi}{t}=(D_r+iD_i)\nabla^2 \psi+(a_r+ia_i)\psi+(b_r+ib_i)\psi|\psi|^2,$$

where, typically, we need $b_r,D_r \geq 0$ for solutions to exist etc.

* Load the [interactive simulation](/sim/?preset=complexGinzburgLandau). 

* Change the parameters $b_i$ to see a wide range of interesting behaviours. $b_i=-5, -1, 0, 1, 2$ for example all give distinct dynamical regimes.
