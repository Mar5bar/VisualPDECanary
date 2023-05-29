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

where we typically need $b_r,D_r \geq 0$ for solutions to exist.

* Load the [interactive simulation](/sim/?preset=complexGinzburgLandau) 

* Change the parameter $b_i$ to see a wide range of interesting behaviours. The values $b_i=-5, -1, 0, 1, 2$ all give distinct dynamical regimes, for example.

# Numerical notes

As in the [Schrödinger equation](/basic-pdes/stabilised-schrodinger), we have to separate out the real and imaginary parts of $\psi$ to simulate it. We write $\psi=u+\i v$ to find

$$\begin{aligned}\pd{u}{t}&=D_r\nabla^2u-D_i\nabla^2 v+a_ru-a_iv+(b_ru-b_iv)(u^2+v^2),\\ 
\pd{v}{t} &= D_i\nabla^2 u+D_r\nabla^2v+a_rv+a_iu+(b_rv+b_iu)(u^2+v^2).
\end{aligned}$$

# Solitons 

The [Nonlinear Schrödinger equation](https://en.wikipedia.org/wiki/Nonlinear_Schr%C3%B6dinger_equation) is a special case of this model, typically written as

$$
i\pd{\psi}{t}=-\nabla^2 \psi+\kappa\psi|\psi|^2.
$$

The sign of $\kappa$ determines if the system is "focusing" or "defocusing" and, hence, if we can observe dark or bright [solitons](https://en.wikipedia.org/wiki/Soliton).

[This simulation](/sim/?preset=NonlinearSchrodingerSoliton) is an example of a soliton moving to the right at a speed $c$, determined entirely by the initial condition. If you change the value of $\kappa$ and restart the simulation, you can observe different behaviours. For example, $\kappa=-1$ gives a defocusing equation, for which the soliton eventually breaks apart into something resembling a moving [Jacobi elliptic function](https://en.wikipedia.org/wiki/Jacobi_elliptic_functions). We note that the simulator used does not preserve the conserved quantities in this model, so may give spurious or incorrect solutions for some parameters or initial conditions.

# Coupled Ginzburg-Landau Systems

We can also consider generalizations of coupled systems, particularly an optics formalism known as "cross-phase modulation." Models of this form with cubic nonlinearities look like

$$\begin{aligned}\pd{\psi_1}{t}&=(D_{1r}+\i D_{1i})\nabla^2 \psi_1+(a_{1r}+\i a_{1i})\psi_1+(b_{1r}+\i b_{1i})\psi_1\left( |\psi_1|^2+\alpha_1|\psi_2|^2 \right),\\ \pd{\psi_2}{t}&=(D_{2r}+\i D_{2i})\nabla^2 \psi_2+(a_{2r}+\i a_{2i})\psi_2+(b_{2r}+\i b_{2i})\psi_2\left( |\psi_2|^2+\alpha_2|\psi_1|^2 \right). \end{aligned}$$

The parameters $\alpha_1$ and $\alpha_2$ influence how much the two wavefunctions interact with one another. If these interactions are strong, either species can be driven to extinction, as described in [this paper on amplitude death](https://arxiv.org/abs/1803.02147). In intermediate cases, the two wavefunctions may coexist, leading to dynamics where the wavefunctions are nonzero only in separate subsets of the domain, as described in [this paper on saturable nonlinearities](https://doi.org/10.1016/j.aop.2018.07.003). [This simulation](/sim/?preset=CoupledCGL) explores these separation dynamics, where the wavefunctions are locally chaotic but their boundaries are determined by where the other wavefunction is nonzero. You can toggle between the amplitudes of each wavefunction by clicking {{ layout.views }} and selecting one wavefunction or the other.
