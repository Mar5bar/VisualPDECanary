---
layout: page
title: Validating VisualPDE
lesson_number: 10
thumbnail: /assets/images/ValidatingVisualPDE.webp
extract: VisualPDE versus exact solutions
---

When implementing VisualPDE, we were somewhat sceptical of browser-based computation and questioned if it could be relied upon, especially in the context of PDEs. Here we showcase some of the examples that have convinced us of VisualPDE's surprising accuracy.

### The heat equation

Perhaps the simplest equation that VisualPDE can solve is the heat equation, as explored in this [detailed example](/basic-pdes/heat-equation). With $T(x,t)$ as the temperature in an infinite domain, the heat equation

$$\pd{T}{t}=D_T \nabla^2 T$$

admits solutions of the Gaussian form 

$$T(x,t) = \frac{1}{\sqrt{t}}\exp\left(-\frac{x^2}{4t}\right).$$

Hence, if the initial data is Gaussian, the solution evolves as a Gaussian. We can simulate this scenario in VisualPDE by truncating the infinite domain (applying Neumann boundary conditions) and specifying initial data of this form. Note that the exponential solution decays rapidly to zero far away from the mean of the Gaussian, so that the finite-domain approximation is a very good one.

This [heat equation simulation](/sim/?preset=heatEquation1DValidity) is set up to do just that. To check if the numerical solution is accurate, we've plotted the analytical solution (thin curve) on top of the numerical one (thick curve). As you might have hoped, VisualPDE does an excellent job of capturing the spatiotemporal evolution of the exact solution. This is especially remarkable as this particular simulation uses a fairly coarse spatial discretisation and a forward Euler timestepping scheme. 

If you turn on **Auto snap**:
<span class='click_sequence'>{{ layout.views }} → **Auto snap**</span>
 and wait until $t=2\times 10^{3}$, you'll actually start to see the plotting of the analytical solution break down due to the implementation of the exponential function on your GPU, and the two solutions begin to separate.

### The wave equation

In our [first look at the wave equation](/basic-pdes/wave-equation), we saw how we can cast this hyperbolic PDE in an approximate parabolic form that can be solved by VisualPDE. The true wave equation in 1D, written as

$$\pdd{u}{t}=D \nabla^2 u$$

for amplitude $u(x,t)$, has simple solutions if $\partial u / \partial t=0$ initially, composed only of leftward and rightward travelling waves. The exact form can be found easily using [d'Alembert's solution](https://mathworld.wolfram.com/dAlembertsSolution.html).

In this [wave equation simulation](/sim/?preset=waveEquation1DValidity), we numerically solve our close approximation to the wave equation with stationary initial data, plotting the exact solution on top. As before, we observe very good agreement between the two solutions. As expected, this agreement lessens over time as the effects of our approximation accumulate. Reducing the regularisation parameter $C$ improves this agreement, but setting it to zero causes spurious oscillations to eventually emerge in the numerical solution.

### A conservative system

As VisualPDE is designed to solve a broad range of PDEs, it often fails to precisely capture conserved quantities in special systems. The [Schrödinger equation](https://en.wikipedia.org/wiki/Schrödinger_equation) is a good example of this, explored on the [Schrödinger page](/basic_pdes/stabilised-schrodinger). 

In this [alternative simulation](/sim/?preset=stabilizedSchrodinger1DValidity), try changing the timestepping scheme and restarting the simulation. As might be expected, higher order schemes like the midpoint method and Runge-Kutta 4 do a better job of preserving the total integral of the system (which should be unity) than the (default) forward Euler method. 

To get a handle on this quantitatively, we've enabled **Auto pause**:
<span class='click_sequence'>{{ layout.settings }} → **Timestepping** → **Auto pause**</span>
which stops the simulation at a specified time so that you can compare the values obtained with each of the numerical schemes.