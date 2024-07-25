---
layout: page
title: Diffusively-Coupled Chaos
lesson_number: 20
thumbnail: /assets/images/Lorenz.png
extract: Butterfly effects in space
equation: $\pd{X}{t} = D \nabla^2 X + \sigma \left(Y-X\right)$, $\pd{Y}{t} = D \nabla^2 Y + X \left(\rho-Z\right)-Y$, $\pd{Z}{t} = D \nabla^2 Z + X Y-\beta Z$
categories: [chaos, integrable, parabolic]
---

# Lorenz Equations

The [Lorenz system](https://arxiv.org/abs/cond-mat/0106115) is a well-known system of three ordinary differential equations which exhibit chaotic dynamics. If we imagine coupling this system via diffusion (that is, adding a Laplacian to each equation), we arrive at the following system:

$$
\begin{aligned}
    \pd{X}{t} &= D \nabla^2 X + \sigma \left(Y-X\right),\\
    \pd{Y}{t} &= D \nabla^2 Y + X \left(\rho-Z\right)-Y,\\
    \pd{Z}{t} &= D \nabla^2 Z + X Y-\beta Z,
    \end{aligned}
$$

which can exhibit a variety of spatiotemporal behaviours.

* Load the [interactive simulation](/sim/?preset=Lorenz) to see a random initial condition evolve into several complex oscillating structures. These change over long timescales, so you may want to watch the simulation for a while to see how they coalesce and interact.

* The initial condition uses a random perturbation across the spatial domain. If you change $X(t=0)=0$, the system will be at an equilibrium state and not move. If you then click, you can initiate localised travelling oscillations, with multiple clicks interacting with one another in interesting ways.

* Modifying the value of $D$, which is effectively the coupling strength between local chaotic systems, can be one fun way to explore the parameter space. For large values (e.g. $D=5$) the system tends toward a uniform state with large-wavelength  oscillations, whereas for small values (e.g. $D=0.2$) it behaves more erratically, breaking up into local patches of oscillating and chaotic regions.
