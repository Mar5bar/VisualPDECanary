---
layout: page
title: Quick start
lesson_number: 10
thumbnail: /assets/images/heat-equation.png
extract: Two-minute top tips
---

### The equations panel <a id='equations-panel'>
Pressing {{ layout.equations }} opens up the **equations panel**.

{:refdef: style="text-align: center;"}
![Equations panel](/assets/images/equations-panel.png){: width="253px" }
{: refdef}

Here you can:
* See the [equation being simulated](#equations), here $\pd{u}{t} = \vnabla\cdot(D\vnabla u) + f$.
* Set the named functions in the equations, here $D$ and $f$. These can be functions of any component and time (here $u$ and $t$), and of any parameters which will be defined further down the panel.
* Set the value of any extra parameters
* Set the [boundary conditions](#boundary-conditions)

### Domain shape <a id='domain-shape'>

The default **domain** for solving PDEs is a 2D rectangle, $\Omega = [0,L_x]\times[0,L_y]$, which fits the size of your browser window or phone screen.

You can force the domain to be square, $\Omega = [0,L]\times[0,L]$, by toggling <span class='click_sequence'>{{ layout.settings }} → **Domain** → **Square**</span>

### Boundary conditions <a id='boundary-conditions'>

The following **boundary conditions** are available to allow you to set the value of the function, or the value of its derivative, along the boundary $\partial \Omega$ of the domain $\Omega$:

* Periodic
* [Dirichlet](https://en.wikipedia.org/wiki/Dirichlet_boundary_condition) (e.g. $u\|_{\partial \Omega} = 0$)
* [Neumann](https://en.wikipedia.org/wiki/Neumann_boundary_condition) (e.g. $\pd{u}{n}\|_{\partial \Omega} = 0$)
* [Robin](https://en.wikipedia.org/wiki/Robin_boundary_condition) (e.g. $(u + \pd{u}{n})\|\_{\partial \Omega} = 0$)

You can swap between boundary conditions by choosing <span class='click_sequence'>{{ layout.equations }} → **Boundary conditions**</span> and selecting from the list for each variable.

### Changing the equations <a id='equations'>

The simplest system VisualPDE can solve is a single PDE,

$$\pd{u}{t} = \vnabla \cdot (D \vnabla u) + f,$$

where $D$ and $f$ are functions of $u$ and $t$ you can specify.

The most complicated type is a system of PDEs in three components, $u$, $v$ and $w$:

$$\begin{aligned}
\pd{u}{t} &= \vnabla \cdot(D_{uu}\vnabla u+D_{uv}\vnabla v+D_{uw}\vnabla w) + f,\\
\pd{v}{t} &= \vnabla \cdot(D_{vu}\vnabla u+D_{vv}\vnabla v+D_{vw}\vnabla w) + g,\\
\text{or}\left\{\begin{matrix}\displaystyle\pd{w}{t} \\ w\end{matrix}\right. & 
\begin{aligned}
    &= \vnabla \cdot(D_{wu}\vnabla u+D_{wv}\vnabla v+D_{ww}\vnabla w) + h \vphantom{\displaystyle\pd{w}{t}}, \\
    &= \vnabla \cdot(D_{wu}\vnabla u+D_{wv}\vnabla v) + h,
\end{aligned}
\end{aligned}$$

where $D_{uu}, \dots,  D_{ww}$ and $f$, $g$ and $h$ are functions of $u$, $v$, $w$ and $t$ that you can specify.

* You can change the number of components by choosing <span class='click_sequence'>{{ layout.settings }} → **Equations** → **No. species**</span>
* In systems of multiple components, you can include terms representing cross-diffusion (e.g. $D_{uv}$, $D_{vu}$) by toggling <span class='click_sequence'>{{ layout.settings }} → **Equations** → **Cross**</span>
* In systems of multiple components, you can choose between a differential or algebraic equation for the final component (e.g. '$\partial w/\partial t=$' or '$w=$') by toggling <span class='click_sequence'>{{ layout.settings }} → **Equations** → **Algebraic w?** (or **v?**)</span>

