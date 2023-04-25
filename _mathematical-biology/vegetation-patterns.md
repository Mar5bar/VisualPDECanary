---
layout: page
title: Banded vegetation patterns
lesson_number: 130
thumbnail: /assets/images/VegetationPatterns.png
extract: Stripes moving towards water
equation: $\pd{w}{t} = a-w -wn^2+v\pd{w}{x} + \nabla^2w$, $\pd{n}{t} = wn^2 - mn + \nabla^2n$ 
---

Here we look at a model of vegetation patterning known as the [Klasumeier model](https://www.science.org/doi/full/10.1126/science.284.5421.1826).

$$\begin{aligned}\pd{w}{t} &= a-w -wn^2+v\pd{w}{x} + \nabla^2w,\\ \pd{n}{t} &= wn^2 - mn + \nabla^2n\end{aligned}$$

* Load the [interactive simulation](/sim/?preset=KlausmeierModel). Note that this model always has a plant-extinction state being stable.

* The simulation starts in a parameter regime where pure stripes (regular patterns) are favoured over time. If you instead set $a=0.4$, $m=0.4$, the environment will be much harsher, leading to less regular patterns. However, this also makes the extinction state more stable, so you may have to brush sufficient initial data to overcome this Allee-like effect.
