---
layout: page
title: Diffusively-coupled oscillators
lesson_number: 140
thumbnail: /assets/images/VanderPolOscillator.webp
extract: Nonlinearity and oscillation in space
equation: $\pdd{X}{t} = D \nabla^2 X+ \mu*(1-X^2)\pd{X}{t}-X,$
categories: [chaos, integrable, parabolic]
---

Below are some examples of nonlinear oscillators where we think of each spatial point as an ODE and couple these by diffusion. *Warning:* As these are oscillators, do be mindful that some parameters *may have rapid flashing.*

## Coupled Van der Pol oscillators

The (unforced) [Van der Pol Oscillator](https://en.wikipedia.org/wiki/Van_der_Pol_oscillator) is a well-known example of a nonlinear oscillator of the form,

$$
\diff{^2X}{t^2} = \mu*(1-X^2)\diff{X}{t}-X,\\
$$

where $\mu$ is a coefficient of nonlinear damping. We now consider adding linear diffusive coupling to a spatial variant of it. Writing this as a system of first-order equations in time, we then have,

$$
\begin{aligned}
    \pd{X}{t} &= Y ,\\
    \pd{Y}{t} &= D (\nabla^2 X + \varepsilon \nabla^2 Y) + \mu*(1-X^2)\fd{X}{t}-X,
    \end{aligned}
$$

where $D$ is a diffusion coefficient, and the term involving $\varepsilon$ is a kind of artificial diffusion to dampen numerical instabilities.

The [interactive Van der Pol simulation](/sim/?preset=VanDerPol) shows how this system behaves with random initial data. Changing $\mu$ gives different structures acting on different time and length scales. You can also set the initial condition to be a constant (e.g. 0) and click to initiate a wave.

## Coupled Duffing equations

The [Duffing equation](https://en.wikipedia.org/wiki/Duffing_equation) is another example of a nonlinear oscillator, where again we can add linear diffusive coupling to a spatial variant of it to get:

\begin{aligned}
    \textstyle  \pd{X}{t} &= \varepsilon D \lap X + Y\\
    \textstyle  \pd{Y}{t} &= D \lap X -\delta Y-\alpha X-\beta {X}^{3}+\gamma \cos{\left(\omega t\right)}
    \end{aligned}

where $D$, $\alpha$, $\beta$ are parameters of the model, $\varepsilon$ is again an artificial diffusion term, and  we have included a temporal forcing term (with parameters $\gamma$ and $\omega$) to increase the variety of observed dynamics.

The [interactive Duffing equation simulation](/sim/?preset=Duffing) simulates this model with random initial conditions. Changing the value of $\alpha$ can lead to a variety of interesting dynamics.
