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

* As discussed in its own page, this model has a huge range of behaviours, and these are all likely influenced by advection.

## Localized Swift-Hohenberg Swiftly Moving

* We next consider the localised solutions from the [Swift-Hohenberg equation](/nonlinear-physics), and add a parameter $Q$ for unidrectional and rotational advection to get [moving localised patterns](/sim/?preset=swiftHohenbergLocalisedAdvection).

* Setting $Q=1$ gives unidirectional advection, and the localised structure moves along a direction given by the parameter $\theta$. Setting $Q=2$ instead rotates the pattern around the centre of the screen. Changing $V$ impacts the velocity of this movement. Note that if $V$ becomes too large, the pattern can generate structures which misbehave at the boundaries (as these will interact with advection in odd ways).
