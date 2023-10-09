---
layout: page
title: The Gray–Scott model
lesson_number: 50
thumbnail: /assets/images/GrayScott.webp
extract: Complex reaction–diffusion 
equation: $\pd{u}{t}=\nabla^2 u+u^2v - (a+b)u$, $\pd{v}{t}=D\nabla^2v -u^2v + a(1 - v)$
---
A reaction–diffusion system heavily studied for its complex dynamics is the Gray–Scott system, given by

$$\begin{aligned}\pd{u}{t}&=\nabla^2 u+u^2v - (a+b)u,\\ \pd{v}{t}&=D\nabla^2v-u^2v + a(1 - v),\end{aligned}$$

where we take $D=2$ and only vary $a,b>0$. This model has a [wide range of behaviours](http://www.mrob.com/pub/comp/xmorphia/index.html), shown in [another WebGL simulator](https://pmneila.github.io/jsexp/grayscott/) that partially inspired VisualPDE.

* Load the [interactive simulation](/sim/?preset=GrayScott) to explore the system.
  
* A [famous paper](https://arxiv.org/abs/patt-sol/9304003) on this model explored a range of the parameters $a$ and $b$ to classify different behaviours, and many people have hence made these parameters depend linearly on $x$ and $t$ to see all of this behaviour at once. [This simulation](/sim/?preset=GrayScottPearsonClassification) explores this approach, with $a$ depending on $y$ in the range $a \in [0,0.07]$ and $b$ depending on $x$ in the range $b \in [0.02, 0.068]$.

* Building from the previous simulation, we can rescale the heterogeneity to still be monotonic, but to use up more of the domain to see different dynamical regimes. We explore this in [this simulation](/sim/?preset=GrayScottPearsonClassificationRescaled), where we also plot the variable $v$ instead by default (you can click on {{ layout.views }} to change this to plot $u$ instead). Interestingly, the value of $D=2$ used gives a very rich parameter space, whereas making $D$ smaller reduces the regions of patterned behaviour, and taking $D$ larger increases it at the cost of making things more stationary and more spot-like for most of the parameter domain. Interestingly, when $D=1$ the system no longer supports stationary patterns, but does exhibit waves similar to the spiral waves in the equal-diffusion case of the [cyclic competition models](/mathematical-biology/cyclic-competition).

Below we've listed some parameter combinations that give rise to different and interesting behaviours. One of our favourites is the [moving spots simulation](/sim/?preset=GrayScottGliders), which exhibits spots bobbing around. If you initiate this motion and then increase $b$ slowly to about $b=0.56$, the spots become sparse and start exhibiting strange diversions in their motions.

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
