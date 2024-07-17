---
layout: page
title: Bending in nonlinear beams
lesson_number: 110
thumbnail: /assets/images/nonlinear-beam.webp
extract: Exploring state-dependent stiffness
equation: $\pd{y}{t}=-\pdd{}{x}[E(y)\pdd{y}{x}]$
categories: [elasticity, parabolic]
---

In the absence of inertia, the dimensionless equation of motion for a beam with a small deflection $y(x,t)$ is

$$\begin{aligned}\pdd{y}{t}=-\pdd{}{x}\left(E\pdd{y}{x}\right),\end{aligned}$$

where $E$ represents the stiffness of beam, or how difficult it is to bend. Traditionally, this stiffness is taken to be a constant or perhaps to depend on the position $x$.

In the simulation below, we consider a beam with a stiffness that depends on the local curvature, so that

$$\begin{aligned}E = E\left(\pdd{y}{x}\right) = E^\star + \Delta_E\frac{1+\tanh{(\pdd{y}{x}/\epsilon})}{2} \end{aligned}$$

for baseline stiffness $E^\star$, stiffness change $\Delta_E$, and sensitivity $\epsilon$. 

We can play with $\Delta_E$ using the slider below. The minimum value corresponds to a beam with constant stiffness, while the maximum value corresponds to a beam with a stiffness that depends strongly on the curvature. A quick exploration highlights that the dynamics of the beam depend significantly on the differential stiffness.

<p style="text-align:center;margin-bottom:0"><vpde-slider
    iframe="sim"
    name="Delta_E"
    label="$\Delta_E$"
    label-position="above"
    min="0"
    max="24"
    value="0"
    step="0.1"
    min-label="$0$"
    max-label="$24$"
    host="/"
    ></vpde-slider></p>

<iframe id="sim" class="sim" src="/sim/?preset=differentialStiffness&story&sf=1" frameborder="0" loading="lazy" style="margin-bottom:1em"></iframe>

Play with this example in more detail in this [customisable simulation](/sim/?preset=differentialStiffness).

<!-- For more details on this topic, take a look at this [paper](https://arxiv.org/abs/2204.13820). -->
