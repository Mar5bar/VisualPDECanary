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
![Under construction](/assets/images/equations-panel.png){: width="253px" }
{: refdef}

Here you can:
* See the equation being simulated, here $\pd{u}{t} = \vnabla\cdot(D\vnabla u) + f$.
* Set the named functions in the equations, here $D$ and $f$. These can be functions of any variable named in the equation (here $u$), and of any parameters which will be defined further down the panel.
* Set the value of any extra parameters
* Set the [boundary conditions](#boundary-conditions)

### Domain shape <a id='domain-shape'>

The default **domain** for solving PDEs is a 2D rectangle, $\Omega = [0,L_x]\times[0,L_y]$, which fits the size of your browser window or phone screen.

You can force the domain to be square, $\Omega = [0,L]\times[0,L]$, by toggling {{ layout.settings }}→**Domain**→**Square**.

### Boundary conditions <a id='boundary-conditions'>

The following **boundary conditions** are available to allow you to set the value of the function, or the value of its derivative, along the boundary $\partial \Omega$ of the domain $\Omega$:

* Periodic
* [Dirichlet](https://en.wikipedia.org/wiki/Dirichlet_boundary_condition) (e.g. $u\|_{\partial \Omega} = 0$)
* [Neumann](https://en.wikipedia.org/wiki/Neumann_boundary_condition) (e.g. $\pd{u}{n}\|_{\partial \Omega} = 0$)
* [Robin](https://en.wikipedia.org/wiki/Robin_boundary_condition) (e.g. $(u + \pd{u}{n})\|\_{\partial \Omega} = 0$)

You can swap between boundary conditions by choosing {{ layout.equations }}→**Boundary conditions** and selecting from the list for each variable.

For 


