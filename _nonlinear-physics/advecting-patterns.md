---
layout: page
title: Pattern formation & advection
lesson_number: 70
thumbnail: /assets/images/GrayScottAdvection.webp
extract: Going with the flow?
equation: 
categories: [patterns, parabolic]
---
Each of the examples on this page will be a variation of a previous example incorporating one or more linear advection terms. This will introduce a velocity parameter $V$ and, in the unidrectional case, a direction $\theta$.

## Gliders swimming upstream

* We start with the glider example from the [Gray–Scott](/nonlinear-physics/gray-scott) model, and add an advection term in the $u$ equation to get an example of [drifting gliders](/sim/?preset=GrayScottGlidersAdvecting). 

* The boundaries here will destroy the patterns as mass will be lost at boundaries orthogonal to the flow. Decreasing $V$ will allow the moving spots to survive longer, whereas increasing it will lead to wave-selection.

* As discussed in its own page, this model has a huge range of behaviours, and these are all likely influenced by advection.

## Localised Swift–Hohenberg swiftly moving

* We next consider the localised solutions from the [Swift–Hohenberg equation](/nonlinear-physics), and consider two cases of moving patterns under advection. The first is [unidirectional motion](/sim/?preset=swiftHohenbergLocalisedDirectedAdvection) at an angle $\theta$, and the second is [rotational advection](/sim/?preset=swiftHohenbergLocalisedRotationalAdvection).

* In both cases, changing $V$ impacts the velocity of this movement. Note that if $V$ becomes too large in the rotational case, the pattern can generate structures which misbehave at the boundaries (as these will interact with advection in odd ways). In particular, the rotating velocity field which is advecting $u$ is itself not periodic.

* Changing $P$ and restarting the simulation allows you to explore how these different localised solutions change their structure under advection.
