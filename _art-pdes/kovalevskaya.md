---
layout: page
title: Kovalevskaya on chaos
lesson_number: 5
thumbnail: /assets/images/Kovalevskaya.webp
extract: Playing in time and space
equation: $\pd{\psi}{t}=(D_r+\i D_i)\nabla^2 \psi+(a_r+\i a_i)(1-I_S(x,y))\psi+(b_r+\i b_i)\psi|\psi|^2$
---
Functions of space can allow us to change how a PDE solution varies in space and time. This page explores an example using an image of [Sofya Kovalevskaya](https://en.wikipedia.org/wiki/Sofya_Kovalevskaya) encoded as the function $I_S(x,y)$. The system uses the [complex Ginzburg–Landau equation](/nonlinear-physics/nls-cgl).

* Load one of the interactive simulations demonstrating [dark soliton pinning](/sim/?preset=SofyaCGLEDuckPinning), [localised chaos](/sim/?preset=SofyaCGLEChaos), or [fireflies](/sim/?preset=SofyaCGLEFireflies). 

* You can upload your own image by clicking on <span class='click_sequence'>{{ layout.settings }} → **Images**</span> and then clicking on the image of Sofya Kovalevskaya's face next to $I_S(x,y)$. The image will be effectively treated as a greyscale function $I_T(x,y)$, which will be approximately 1 when the image is close to white and approximately 0 when the image is close to black.

* Change $I_T$ to $I_S$ in <span class='click_sequence'>{{ layout.equations }} → **Definitions** </span> to see another famous mathematical face: [Alan Turing](https://en.wikipedia.org/wiki/Alan_Turing).

* You can upload a replacement for either of these images under <span class='click_sequence'>{{ layout.settings }} → **Images**.</span> They can each be used as heterogeneities in many parts of VisualPDE.
