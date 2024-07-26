---
layout: page
title: Diffusively-coupled Lorenz model
lesson_number: 140
thumbnail: /assets/images/Lorenz.webp
extract: Butterfly effects in space
equation: $\pd{X}{t} = D \nabla^2 X + \sigma \left(Y-X\right)$, $\pd{Y}{t} = D \nabla^2 Y + X \left(\rho-Z\right)-Y$, $\pd{Z}{t} = D \nabla^2 Z + X Y-\beta Z$
categories: [chaos, integrable, parabolic]
---

## Coupled Van der Pol oscillators

The (unforced) [Van der Pol Oscillator](https://en.wikipedia.org/wiki/Van_der_Pol_oscillator) is a well-known example of a nonlinear oscillator of the form,

$$
\fdd{X}{t} = \mu*(1-X^2)\fd{X}{t}-X,\\
$$

where again we can add linear diffusive coupling to a spatial variant of it. Writing this as a system of first-order equations in time, adas3we then have,

$$
\begin{aligned}
    \pd{X}{t} &= Y ,\\
    \pd{Y}{t} &= D \nabla^2 X + \mu*(1-X^2)\fd{X}{t}-X
    \end{aligned}
$$

[interactive Van der Pol simulation](/sim/?preset=VanDerPol)

## Coupled Duffing equations

The [Duffing equation](https://en.wikipedia.org/wiki/Duffing_equation) is another example of a nonlinear oscillator, where again we can add linear diffusive coupling to a spatial variant of it (though here we include a temporal forcing term to increase the variety of observed dynamics).

[interactive Duffing equation simulation](/sim/?preset=Duffing)
