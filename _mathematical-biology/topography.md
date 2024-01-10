---
layout: page
title: Hills and valleys
lesson_number: 150
thumbnail: /assets/images/SpringOnTopography.webp
extract: Effects of topography on models of water and vegetation
---


# Focussing on the fluid

Let's take a more detailed look at water. We could adapt the [shallow-water equations](https://en.m.wikipedia.org/wiki/Shallow_water_equations) that we used in our [Visual Story on waves](/visual-stories/ripples), but instead we'll use a simpler model that's really more suited to glaciers and lava than water.

For water of height $h(x,y,t)$ above topography of height $T(x,y)$, this model of gravity-driven flow over terrain reduces to the scalar PDE

$$\pd{h}{t}=D\vnabla \cdot(h^3\nabla(h+T)),$$

where $D$ represents the relative strength of gravity to the stickiness of the fluid. This equation (with some helpful [numerical tricks](https://en.wikipedia.org/wiki/Flux_limiter)) is encoded in an [interactive simulation](/sim/?preset=WaterOnTopography) that lets us click to introduce water to the rolling landscape.

* Try clicking to introduce spots of water and watch as they flow down into the valleys.

* Make it rain by dragging over the terrain, gradually filling up the riverbed.

* Try modifying the equation for $h$ by including a constant rainfall (0.001 should be enough) and see the landscape slowly fill.

Of course, rivers aren't only filled by rain. Let's see what happens if we introduce a spring to the hillside. This [interactive simulation](/sim/?preset=WaterOnTopographySpring) captures the same river system as before, but now with a spring emerging from one of the hilltops.

* Watch as the spring spreads down the hillside and gradually fills up the large riverbed.

* Try speeding up the process by clicking to add in additional springs.

Looking for high-resolution versions of these simulations? Try out our [high-resolution rain](/sim/?preset=WaterOnTopographyHighres) and [high-resolution spring](/sim/?preset=WaterOnTopographySpringHighres) simulations, which might stretch your device to its limits.