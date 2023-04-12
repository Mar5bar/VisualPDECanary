---
layout: page
title: Quick start
lesson_number: 10
thumbnail: /assets/images/start.png
extract: Two-minute top tips
---

### The equations panel <a id='equations-panel'>
Pressing {{ layout.equations }} opens up the **equations panel**.

{:refdef: style="text-align: center;"}
![Equations panel](/assets/images/equations-panel.png){: width="253px" }
{: refdef}

Here you can:
* See the [equation being simulated](#equations), here $\pd{u}{t} = \vnabla\cdot(D\vnabla u) + f$.
* Set the named functions in the equations, here $D$ and $f$, under **Definitions**. These can be functions of any of the unknowns, space, and time (here $u$, $x$, $y$, and $t$), and of any parameters that will be defined further down the panel.
* Set the value of any extra parameters.
* Set the [boundary conditions](#boundary-conditions).
* Set the [initial conditions](#initial-conditions).

### Domain shape <a id='domain-shape'>

The default **domain** for solving PDEs is a 2D rectangle, $\domain = [0,L_x]\times[0,L_y]$, which fits the size of your browser window or phone screen. Throughout VisualPDE, we use coordinates $x\in[0,L_x]$ and $y\in[0,L_y]$.

You can force the domain to be square, $\domain = [0,L]\times[0,L]$, by toggling <span class='click_sequence'>{{ layout.settings }} → **Domain** → **Square**</span>

### Boundary conditions <a id='boundary-conditions'>

The following **boundary conditions** are available to allow you to set the value of the function, or the value of its derivative, along the boundary $\boundary$ of the domain $\domain$:

* Periodic
* [Dirichlet](https://en.wikipedia.org/wiki/Dirichlet_boundary_condition) (e.g. $u\onboundary = 0$)
* [Neumann](https://en.wikipedia.org/wiki/Neumann_boundary_condition) (e.g. $\pd{u}{n}\onboundary = 0$)
* [Robin](https://en.wikipedia.org/wiki/Robin_boundary_condition) (e.g. $(u + \pd{u}{n})\onboundary = 0$)

You can swap between boundary conditions by choosing <span class='click_sequence'>{{ layout.equations }} → **Boundary conditions**</span> and selecting from the list for each variable.

### Initial conditions <a id='initial-conditions'>
You can specify the values to which the unknowns ($u$, $v$, $w$) are initialised when resetting the simulation. These expressions can be functions of $x$, $y$, the special string 'RAND' that assigns a random number in [0,1] to each point in the domain, along with any user-defined parameters and the images $S$ and $T$ (see the [advanced documentation](/user-guide/advanced-options) for more details). You can also use $L_x$ and $L_y$, accessible via 'Lx' and 'Ly', even when the domain is square.

### Changing the equations <a id='equations'>

The simplest system VisualPDE can solve is a single PDE,

$$\pd{u}{t} = \vnabla \cdot (D \vnabla u) + f,$$

where $D$ and $f$ are functions of $u$, $x$, $y$, and $t$ that you can specify.

The most complicated type is a system of PDEs in four unknowns, $u$, $v$, $w$ and $q$:

$$\begin{aligned}
\pd{u}{t} &= \vnabla \cdot(D_{uu}\vnabla u+D_{uv}\vnabla v+D_{uw}\vnabla w+D_{uq}\vnabla q) + f,\\
\pd{v}{t} &= \vnabla \cdot(D_{vu}\vnabla u+D_{vv}\vnabla v+D_{vw}\vnabla w+D_{vq}\vnabla q) + g,\\
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

where $D_{uu}, \dots,  D_{qq}$ and $f$, $g$, $h$ and $j$ are functions of $u$, $v$, $w$, $q$, $x$, $y$ and $t$ that you can specify.

* You can change the number of unknowns by choosing <span class='click_sequence'>{{ layout.settings }} → **Equations** → **No. species**</span>
* In systems of multiple unknowns, you can include terms representing cross-diffusion (e.g. $D_{uv}$, $D_{vu}$) by toggling <span class='click_sequence'>{{ layout.settings }} → **Equations** → **Cross**</span>
* In systems of multiple unknowns, you can choose between a differential or algebraic equation for some of the species (e.g. '$\partial w/\partial t=$' or '$w=$') by toggling <span class='click_sequence'>{{ layout.settings }} → **Equations** → **Algebraic w** (or **v** or **q**)</span>

