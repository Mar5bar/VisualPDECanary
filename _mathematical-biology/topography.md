---
layout: page
title: Hills and valleys
lesson_number: 150
thumbnail: /assets/images/SpringOnTopography.webp
extract: Effects of topography on models of water and vegetation
---

Many of the spatial models that people study assume flat, homogeneous domains. In this example, we'll numerically explore what happens if we replace flatness with all of real life's roughness.

# Hillside vegetation

In our [page on vegetation patterns](/mathematical-biology/vegetation-patterns), we explore the [Klausmeier model](https://www.science.org/doi/full/10.1126/science.284.5421.1826), which can be stated as

$$\begin{aligned}\pd{w}{t} &= a-w -wn^2+v\pd{w}{x} + \nabla^2w,\\ \pd{n}{t} &= wn^2 - mn + \nabla^2n\end{aligned}$$

when written in terms of water $w$ and plant biomass $m$. There are many extensions of this model to include varying, real-world topography, some of which are neatly summarised in this [paper](https://royalsocietypublishing.org/doi/10.1098/rsif.2018.0508). We'll use the simplest possible model, which modifies the original to become

$$\begin{aligned}\pd{w}{t} &= a-w -wn^2+ D\nabla^2w + V\vnabla \cdot (w\nabla T),\\ \pd{n}{t} &= wn^2 - mn + \nabla^2n,\end{aligned}$$

where $T(x,y)$ is the spatially varying height of the landscape. The parameters $D$ and $V$ capture the relative sizes of the water transport terms.

* Load this [Klausmeier simulation](/sim/?preset=KlausmeierOnTopography), which implements the modified PDE for a given $T(x,y)$. Watch the vegetation invade into water-rich regions in the valleys, and seemingly travel uphill following rainfall, which then get used up and dry out.

* Try varying the parameters $a$ and $m$ to see how they impact the structure of patterns. 

* What effect does reducing $V$ have on the patterns formed? Do they resemble those in our [flat-domain example](/mathematical-biology/vegetation-patterns)?

# Rainfall on the hilltops

Let's take a more detailed look at water. We could adapt the [shallow-water equations](https://en.m.wikipedia.org/wiki/Shallow_water_equations) that we used in our [Visual Story on waves](/visual-stories/ripples), but instead we'll use a simpler model that's really more suited to glaciers and lava than water.

For water of height $h(x,y,t)$ above topography of height $T(x,y)$, this model of gravity-driven flow over terrain reduces to the scalar PDE

$$\pd{h}{t}=D\vnabla \cdot(h^3\nabla(h+T)),$$

where $D$ represents the relative strength of gravity to the stickiness of the fluid. This equation (with some helpful [numerical tricks](https://en.wikipedia.org/wiki/Flux_limiter)) is encoded in an [rainfall simulation](/sim/?preset=WaterOnTopography) that lets us click to introduce water to the rolling landscape.

* Try clicking to introduce spots of water and watch as they flow down into the valleys.

* Make it rain by dragging over the terrain, gradually filling up the riverbed.

* Try modifying the equation for $h$ by including a constant rainfall (0.001 should be enough) and see the landscape slowly fill.

* We've picked an example of real-world topography for you to explore, but you can swap this out for your local area by swapping out the topographical map found by clicking {{ layout.settings }}→**Images**

# Springing to life

Of course, rivers aren't only filled by rain. Let's see what happens if we introduce a spring to the hillside. This [spring simulation](/sim/?preset=WaterOnTopographySpring) captures the same river system as before, but now with a spring emerging from one of the hilltops.

* Watch as the spring spreads down the hillside and gradually fills up the large riverbed.

* Try speeding up the process by clicking to add in additional springs.

Looking for high-resolution versions of these simulations? Try out [high-resolution rain](/sim/?preset=WaterOnTopographyHighres) and [high-resolution spring](/sim/?preset=WaterOnTopographySpringHighres) simulations, which might stretch your device to its limits.
