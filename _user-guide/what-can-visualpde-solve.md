---
layout: page
title: What can VisualPDE solve?
lesson_number: 30
thumbnail: /assets/images/squirrel.png
extract: A brief intro to the systems we simulate here
---

VisualPDE solves systems of PDEs that look like generalised reaction--diffusion equations. It can do this in 1D or 2D.

The simplest type is a single PDE in a single component, $u$,

$$\pd{u}{t} = \vnabla \cdot (D \vnabla u) + f,$$

where $D$ and $f$ are functions of $u$ and $t$ that you can choose. For example, if $f=0$ and $D$ is a constant, you have [the heat equation](basic-pdes/heat-equation). 

The most complicated type is a system of PDEs in three components, $u$, $v$ and $w$, where all the named variables are functions of the components:

$$\begin{aligned}
\pd{u}{t} &= \vnabla \cdot(D_{uu}\vnabla u+D_{uv}\vnabla v+D_{uw}\vnabla w) + f,\\
\pd{v}{t} &= \vnabla \cdot(D_{vu}\vnabla u+D_{vv}\vnabla v+D_{vw}\vnabla w) + g,\\
\text{or}\left\{\begin{matrix}\displaystyle\pd{w}{t} \\ w\end{matrix}\right. & 
\begin{aligned}
    &= \vnabla \cdot(D_{wu}\vnabla u+D_{wv}\vnabla v+D_{ww}\vnabla w) + h \vphantom{\displaystyle\pd{w}{t}}, \\
    &= \vnabla \cdot(D_{wu}\vnabla u+D_{wv}\vnabla v) + h.
\end{aligned}
\end{aligned}$$

In matrix form, we can summarise this by saying we solve systems of the form

$$\m{M} \pd{\v{u}}{t} = \vnabla\cdot(\m{D}\vnabla\v{u}) + \v{f},$$

where

* $\v{u}$ is a vector of one, two or three components,
* $\m{M}$ is either the identity or identity with one zero; you might know this as a 'mass matrix',
* $\m{D}$ is a possibly nonlinear matrix which may contain zeros; you might know this as a 'diffusion tensor',
* $\v{f}$ is a vector of one, two or three components that contains our interaction or kinetic terms.

VisualPDE allows you to easily change the [number of components](quick-start#equations) and the [boundary conditions](quick-start#boundary-conditions). You can set initial conditions just by tapping the screen.

