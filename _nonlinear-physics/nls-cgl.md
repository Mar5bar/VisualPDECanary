---
layout: page
title: Complex Ginzburg–Landau
lesson_number: 20
thumbnail: /assets/images/complexGinzburgLandau.png
extract: A world of complexity
equation: $\pd{\psi}{t}=(D_r+iD_i)\nabla^2 \psi+(a_r+ia_i)\psi+(b_r+ib_i)\psi|\psi|^2$
---
Here is an implementation of a [(complex) Ginzburg-Landau equation](https://arxiv.org/abs/cond-mat/0106115) given by

$$\pd{\psi}{t}=(D_r+iD_i)\nabla^2 \psi+(a_r+ia_i)\psi+(b_r+ib_i)\psi|\psi|^2,$$

where, typically, we need $b_r,D_r \geq 0$ for solutions to exist.

* Load the [interactive simulation](/sim/?preset=complexGinzburgLandau) 

* Change the parameters $b_i$ to see a wide range of interesting behaviours. The values $b_i=-5, -1, 0, 1, 2$ for example all give distinct dynamical regimes.

# Numerical notes

As in the [Schrödinger equation](/basic-pdes/stabilised-schrodinger), we have to separate out the real and imaginary parts of $\psi$ to simulate it. We write $\psi=u+iv$ to find

$$\begin{aligned}\pd{u}{t}&=D_r\nabla^2u-D_i\nabla^2 v+a_ru-a_iv+(b_ru-b_iv)(u^2+v^2),\\ 
\pd{v}{t} &= D_i\nabla^2 u+D_r\nabla^2v+a_rv+a_iu+(b_rv+b_iu)(u^2+v^2).
\end{aligned}$$

# Solitons 

Nonlinear Schrödinger and more COMING SOON! Integrable systems are tough...
