---
layout: page
title: We ❤️ PDEs
lesson_number: 20
thumbnail: /assets/images/hearts.png
extract: Beating hearts and slime moulds
equation: $\pd{u}{t}=\nabla^2 u+$❤️
---
Here are some examples of a PDE solutions on a domain based on a [heart-shaped curve](https://mathworld.wolfram.com/HeartCurve.html). 

# Excitability

Models like [FitzHugh–Nagumo](/mathematical-biology/fitzhugh-nagumo) are the basis for a lot of work in cardiac electrophysiology and related areas. So let's solve these PDEs in a heart!

* Load the [interactive simulation](/sim/?preset=FHNBeatingHeart) and enjoy. You can click {{ layout.settings }}→**Rendering** and select **Surface plot** as the Plot type to get a 3D view of the beating heart.

# Chemotaxis

The next example is based on the [Keller--Segel model for chemotaxis](/mathematical-biology/keller-segel).

* Load the [interactive simulation](/sim/?preset=KellerSegelHeart) and enjoy. 

# Numerical health warning

Our implementation of internal boundaries is somewhat crude, so for now we only support Dirichlet conditions on these boundaries.
