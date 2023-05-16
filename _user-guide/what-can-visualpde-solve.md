---
layout: page
title: What can VisualPDE solve?
lesson_number: 20
thumbnail: /assets/images/squirrel-question.png
extract: A brief intro to the systems we simulate
---

VisualPDE solves systems of PDEs that look like generalised reaction--diffusion equations. It can do this in 1D or 2D.

The simplest type of system is just a single PDE in a single unknown, $u$,

$$\pd{u}{t} = \vnabla \cdot (D \vnabla u) + f,$$

where $D$ and $f$ are functions of $u$, $t$, and space that you can choose. For example, if $f=0$ and $D$ is a constant, you have [the heat equation](/basic-pdes/heat-equation). 

The most complicated type is a system of PDEs in four unknowns, $u$, $v$, $w$ and $q$:

$$\begin{aligned}
\pd{u}{t} &= \vnabla \cdot(D_{uu}\vnabla u+D_{uv}\vnabla v+D_{uw}\vnabla w+D_{uq}\vnabla q) + f,\\
\text{or}\left\{\begin{matrix}\displaystyle\pd{v}{t} \\ v\end{matrix}\right. & 
\begin{aligned}
    &= \vnabla \cdot(D_{vu}\vnabla u+D_{vv}\vnabla v+D_{vw}\vnabla w+D_{vq}\vnabla q) + g \vphantom{\displaystyle\pd{v}{t}}, \\
    &= \vnabla \cdot(D_{vu}\vnabla u+D_{vw}\vnabla w+D_{vq}\vnabla q) + g,
\end{aligned}\\
\text{or}\left\{\begin{matrix}\displaystyle\pd{w}{t} \\ w\end{matrix}\right. & 
\begin{aligned}
    &= \vnabla \cdot(D_{wu}\vnabla u+D_{wv}\vnabla v+D_{ww}\vnabla w+D_{wq}\vnabla q) + h \vphantom{\displaystyle\pd{w}{t}}, \\
    &= \vnabla \cdot(D_{wu}\vnabla u+D_{wv}\vnabla v+D_{wq}\vnabla q) + h,
\end{aligned}\\
\text{or}\left\{\begin{matrix}\displaystyle\pd{q}{t} \\ q\end{matrix}\right. & 
\begin{aligned}
    &= \vnabla \cdot(D_{qu}\vnabla u+D_{qv}\vnabla v+D_{qw}\vnabla w+D_{qq}\vnabla q) + j \vphantom{\displaystyle\pd{q}{t}}, \\
    &= \vnabla \cdot(D_{qu}\vnabla u+D_{qv}\vnabla v+D_{qw}\vnabla w) + j,
\end{aligned}
\end{aligned}$$

where the diffusion coefficients ($D_{uu}$ etc.) and the interaction/kinetic terms ($f$, $g$, $h$, $j$) can depend on the unknowns, space, and time. In matrix form, we can summarise this by saying we solve systems of the form

$$\m{M} \pd{\v{u}}{t} = \vnabla\cdot(\m{D}\vnabla\v{u}) + \v{f},$$

where

* $\v{u}$ is a vector of one, two, three or four unknowns,
* $\m{M}$ is either the identity or the identity with some zeros on the diagonal; you might know this as a 'mass matrix',
* $\m{D}$ is a possibly non-constant matrix that may contain zeros; you might know this as a 'diffusion tensor',
* $\v{f}$ is a vector of one, two, three or four components that contains our interaction or kinetic terms.

VisualPDE allows you to easily change the [number of components](quick-start#equations) and the [boundary conditions](quick-start#boundary-conditions). You can set initial conditions just by clicking/tapping the screen.

