---
layout: page
title: The Gray–Scott model
lesson_number: 70
thumbnail: /assets/images/GrayScott.png
extract: Complex reaction–diffusion 
equation: $\pd{u}{t}=\nabla^2 u+u^2v - (a+b)u$, $\pd{v}{t}=D\nabla^2v -u^2v + a(1 - v)$
---
Each of the examples on this page will be a variation of a previous example incorporating one or more linear advection terms. This will introduce a velocity parameter $V$ and, in the unidrectional case, a direction $\theta$.

## Gliders Swimming Upstream

* We start with the glider example from the [Gray-Scott](/nonlinear-physics/gray-scott) model, and add an advection term in the $u$ equation to get an example of [drifting gliders](/sim/?preset=GrayScottGlidersAdvecting). 

* The boundaries here will destroy the patterns as mass will be lost at boundaries orthogonal to the flow. Decreasing $V$ will allow the moving spots to survive longer, whereas increasing it will lead to wave-selection.

## Localized Swift-Hohenberg Swiftly Moving
