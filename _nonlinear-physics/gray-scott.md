---
layout: page
title: Gray–Scott model
lesson_number: 50
thumbnail: /assets/images/GrayScott.webp
extract: Intricate reaction–diffusion patterning
equation: $\pd{u}{t}=\nabla^2 u+u^2v - (a+b)u,$ $\pd{v}{t}=D\nabla^2v -u^2v + a(1 - v)$
categories: [patterns, waves, chaos, parabolic]
---
A reaction–diffusion system heavily studied for its complex dynamics is the Gray–Scott system, given by

$$\begin{aligned}\pd{u}{t}&=\nabla^2 u+u^2v - (a+b)u,\\ \pd{v}{t}&=D\nabla^2v-u^2v + a(1 - v),\end{aligned}$$

where we take $D=2$ and only vary $a,b>0$. This model has a [wide range of behaviours](http://www.mrob.com/pub/comp/xmorphia/index.html), shown in [another WebGL simulator](https://pmneila.github.io/jsexp/grayscott/) that partially inspired VisualPDE.

* Load the [interactive simulation](/sim/?preset=GrayScott) to explore the system.
  
A [famous 1993 paper](https://arxiv.org/abs/patt-sol/9304003) on this model explored a range of the parameters $a$ and $b$ to classify different behaviours, and many people have hence made these parameters depend linearly on $x$ and $t$ to see all of this behaviour at once. 

* This [classification simulation](/sim/?preset=GrayScottPearsonClassification) explores this approach, with $a$ depending on $y$ in the range $a \in [0,0.07]$ and $b$ depending on $x$ in the range $b \in [0.02, 0.068]$.

Building from the previous simulation, we can rescale the heterogeneity to still be monotonic, but to use up more of the domain to see different dynamical regimes. 

* Explore this in this [rescaled simulation](/sim/?preset=GrayScottPearsonClassificationRescaled), where we also plot the variable $v$ instead by default (you can click on {{ layout.views }} to change this to plot $u$ instead). Here is [another version of this rescaled model](/sim/?preset=GrayScottPorousMedia) which also includes a porous-medium diffusion term (that is, $\nabla^2 u^m$), which radically alters the parameter space as $m$ is increased from 1.

Interestingly, the value of $D=2$ used gives a very rich parameter space, whereas making $D$ smaller reduces the regions of patterned behaviour, and taking $D$ larger increases it at the cost of making things more stationary and more spot-like for most of the parameter domain. 

Furthermore, when $D=1$ the system no longer supports stationary patterns, but does exhibit waves similar to the spiral waves in the equal-diffusion case of the [cyclic competition models](/mathematical-biology/cyclic-competition).

Below we've listed some parameter combinations that give rise to different and interesting behaviours. One of our favourites is the [moving spots simulation](/sim/?preset=GrayScottGliders), which exhibits spots bobbing around. Initiate this motion by clicking and then increase $b$ slowly to about $b=0.56$. The spots become sparse and start exhibiting strange diversions in their motions.

<div style="text-align:center">
<vpde-select
      iframe="iframe"
      display-names="Labyrinthine; Spots; Pulsating spots; Worms; Holes; Spatiotemporal chaos; Intermittent chaos/holes; Moving spots (glider-like); Small waves; Big waves; U-skate world"
      parameters="a=0.037, b=0.06; a=0.03, b=0.062; a=0.025, b=0.06; a=0.078, b=0.061; a=0.039, b=0.058; a=0.026, b=0.051; a=0.034, b=0.056; a=0.014, b=0.054; a=0.018, b=0.051; a=0.014, b=0.045; a=0.062, b=0.061"
></vpde-select>
</div>

<iframe id="iframe" title="VisualPDE simulation" class="sim" style="margin-left:auto;margin-right:auto;margin-bottom:1em;margin-top:1em" src="/sim/?preset=GrayScott" frameborder="0"></iframe>
