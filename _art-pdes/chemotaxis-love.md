---
layout: page
title: We ❤️ PDEs
lesson_number: 40
thumbnail: /assets/images/hearts.webp
extract: Beating hearts and slime moulds
equation: $\pd{u}{t}=\nabla^2 u+$❤️
categories: [art, patterns, chaos]
---
Here are some examples of a PDE solutions on a domain based on a [heart-shaped curve](https://mathworld.wolfram.com/HeartCurve.html). 

# Excitability

Models like [FitzHugh–Nagumo](/mathematical-biology/fitzhugh-nagumo) are the basis for a lot of work in cardiac electrophysiology and related areas. So let's solve these PDEs in a heart!

* Load this [FitzHugh–Nagumo simulation](/sim/?preset=FHNBeatingHeart) and enjoy. You can click {{ layout.views }} and select **3D** to get a 3D view of the beating heart. 
* Try this [growing simulation](/sim/?preset=FHNGrowingHeart) for a crude implementation of these equations on a growing domain.

# Chemotaxis

The next example is based on the [Keller--Segel model for chemotaxis](/mathematical-biology/keller-segel). 

* Load this [Keller--Segel simulation](/sim/?preset=KellerSegelHeart) and enjoy! 
* Try this [growing simulation](/sim/?preset=KellerSegelGrowingHeart) for a crude implementation of these equations on a growing domain.

# Warm hearted

By plotting vector fields on top of the solutions to PDEs, as exemplified in [the heat equation](/basic-pdes/heat-equation), we can visualise how heat flows from a source as it traces out a heart in this [interactive simulation](/sim/?preset=heatHeart).
