---
layout: page
title: Complex Ginzburg–Landau
lesson_number: 20
thumbnail: /assets/images/complexGinzburgLandau.png
extract: A world of complexity
equation: $\pd{\psi}{t}=(D_r+\i D_i)\nabla^2 \psi+(a_r+\i a_i)\psi+(b_r+\i b_i)\psi|\psi|^2$
---
Here is an implementation of a [(complex) Ginzburg-Landau equation](https://arxiv.org/abs/cond-mat/0106115) given by

$$\pd{\psi}{t}=(D_r+\i D_i)\nabla^2 \psi+(a_r+\i a_i)\psi+(b_r+\i b_i)\psi|\psi|^2,$$

where, typically, we need $b_r,D_r \geq 0$ for solutions to exist.

* Load the [interactive simulation](/sim/?preset=complexGinzburgLandau) 

* Change the parameter $b_i$ to see a wide range of interesting behaviours. The values $b_i=-5, -1, 0, 1, 2$ for example all give distinct dynamical regimes.

# Numerical notes

As in the [Schrödinger equation](/basic-pdes/stabilised-schrodinger), we have to separate out the real and imaginary parts of $\psi$ to simulate it. We write $\psi=u+\i v$ to find

$$\begin{aligned}\pd{u}{t}&=D_r\nabla^2u-D_i\nabla^2 v+a_ru-a_iv+(b_ru-b_iv)(u^2+v^2),\\ 
\pd{v}{t} &= D_i\nabla^2 u+D_r\nabla^2v+a_rv+a_iu+(b_rv+b_iu)(u^2+v^2).
\end{aligned}$$

# Solitons 

The [Nonlinear Schrödinger equation](https://en.wikipedia.org/wiki/Nonlinear_Schr%C3%B6dinger_equation) is a special case of this mode, typically written as,

$$
i\pd{\psi}{t}=-\nabla^2 \psi+\kappa\psi|\psi|^2,
$$

with the sign of $\kappa$ determining whether the system is "focusing" or "defocusing", and hence whether we can observe dark or bright [solitons](https://en.wikipedia.org/wiki/Soliton) or other behaviours.

[This simulation](/sim/?preset=NonlinearSchrodingerSoliton) is an example of a soliton moving to the right at a speed given by $c$ (which is determined entirely by the initial condition). If you change the value of $\kappa$ and restart the simulation, you can observe different behaviours. For example, $\kappa=-1$ gives a defocusing equation, for which the soliton eventually breaks apart into something resembly a moving [Jacobi elliptic function](https://en.wikipedia.org/wiki/Jacobi_elliptic_functions). We note that the simulator used does not preserve the conserved quantities in this model, so may give spurious or incorrect solutions for some parameters or initial conditions.
