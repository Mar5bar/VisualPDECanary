---
layout: page
title: The Gray–Scott model
lesson_number: 50
thumbnail: /assets/images/GrayScott.png
extract: Complex reaction-diffusion 
equation: $\pd{u}{t}=\nabla^2 u+u^2v - (a+b)u$, $\pd{v}{t}=D\nabla^2v -u^2v + a(1 - v)$
---
A reaction–diffusion system heavily studied for its complex dynamics is the Gray–Scott system, given by

$$\begin{aligned}\pd{u}{t}&=\nabla^2 u+u^2v - (a+b)u,\\ \pd{v}{t}&=D_v\nabla^2v-u^2v + a(1 - v),\end{aligned}$$

where we take $D_v=2$ and only vary $a,b>0$. This model has a wide range of behaviours, as described in detail [here](http://www.mrob.com/pub/comp/xmorphia/index.html), or shown [in a WebGL simulator](https://pmneila.github.io/jsexp/grayscott/).

* Load the [interactive simulation](/sim/?preset=GrayScott)

Below are a table of parameters which give different behaviours, mirroring identically those in the WebGL implementation above.

| $a$  | $b$  |  Description |
|---|---|---|
| 0.037 | 0.06  |  Labyrinthine |
| 0.03  | 0.062 |  Spots |
| 0.025 | 0.06  |  Pulsating spots |
| 0.078 | 0.061 | Worms |
| 0.039 | 0.058 | Holes |
| 0.026 | 0.051 | Spatiotemporal chaos |
| 0.034 | 0.056 | Intermittent chaos/holes |
| 0.014 | 0.054 | Moving spots (glider-like) |
| 0.018 | 0.051 | Small waves |
| 0.014 | 0.045 | Big waves |
| 0.062 | 0.061 | U-skate world |
