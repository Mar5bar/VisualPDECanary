---
layout: page
title: The Perona-Malik equation
lesson_number: 90
thumbnail: /assets/images/PeronaMalik.png
extract: Image denoising via nonlinear anisotropic diffusion
equation: $\pd{u}{t}=\vnabla \cdot \left (e^{-D |\vnabla u|^2}\vnabla u\right) $

---

Here is an implementation of the [Perona-perona Malik equation](https://en.wikipedia.org/wiki/Anisotropic_diffusion) given by

$$\pd{u}{t}=\vnabla \cdot \left (e^{-D |\vnabla u|^2}\vnabla u\right) $$

which is used for image denoising. In particular, the nonlinear anisotropic diffusion causes sharp gradients to sharpen, and smoothes out more shallow noisy regions.

The [interactive simulation](/sim/?preset=PeronaMalik) starts with some text from a quote by [Bernt Øksendal](https://en.wikipedia.org/wiki/Bernt_%C3%98ksendal), with some noise added on top of it. Pressing play causes this initial condition to sharpen, making the text clearer. You can pause the simulation and use the brush to add more noise to the image, and play with the parameter $D$ to see how it influences the ability to denoise the text. 

You can change the image to one of a noisy [Penrose Tiling](https://en.wikipedia.org/wiki/Penrose_tiling) by modifying the initial conditions to use $I_S$ rather than $I_T$, and then restarting the simulation. Other images will also work, but these may need some fine-tuning to have this algorithm improve their quality. Finer meshes in particular may be needed to preserve small edges.
