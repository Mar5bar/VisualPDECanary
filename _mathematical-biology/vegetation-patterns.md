---
layout: page
title: Banded vegetation patterns
lesson_number: 130
thumbnail: /assets/images/VegetationPatterns.png
extract: Strpes moving towards water
equation: $\pd{w}{t} = a-w -wn^2+v\pd{w}{x} + \nabla^2w$, $\pd{n}{t} = wn^2 - mn + \nabla^2n$ 
---

Here we look at a model of vegetation patterning known as the [Klasumeier model](https://www.science.org/doi/full/10.1126/science.284.5421.1826).

This is a brief example of messy boundary conditions and spatial heterogeneity inducing complex dynamical behaviours. We consider a heterogeneous version of the [Gierer–Meinhardt](/mathematical-biology/gierer-meinhardt) model:

$$\begin{aligned}\pd{w}{t} &= a-w -wn^2+v\pd{w}{x} + \nabla^2w,\\ \pd{n}{t} &= wn^2 - mn + \nabla^2n\end{aligned}$$

* Load the [interactive simulation](/sim/?preset=KlausmeierModel)

* The simulation starts by DESCRIBER PARAMETER REGIMES FOR REGULAR AND IRREGULAR
