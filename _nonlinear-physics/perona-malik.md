---
layout: page
title: The Perona–Malik equation
lesson_number: 90
thumbnail: /assets/images/PeronaMalik.webp
extract: Image denoising via nonlinear anisotropic diffusion
equation: $\pd{u}{t}=\vnabla \cdot \left (\mathrm{e}^{-D |\vnabla u|^2}\vnabla u\right) $
categories: [art, misc]

---

Here is an implementation of the [Perona–Malik equation](https://en.wikipedia.org/wiki/Anisotropic_diffusion),

$$\pd{u}{t}=\vnabla \cdot \left (\mathrm{e}^{-D |\vnabla u|^2}\vnabla u\right),$$

which is used for image denoising. In particular, the nonlinear anisotropic diffusion causes sharp gradients to sharpen, and smooths out more shallow noisy regions.

* Load the [interactive simulation](/sim/?preset=PeronaMalik): it starts with some text from a quote by [Bernt Øksendal](https://en.wikipedia.org/wiki/Bernt_%C3%98ksendal), with some noise added on top of it. 
* Press {{ layout.play }} to cause the initial condition to sharpen, making the text clearer. 
* You can pause the simulation and use the brush to add more noise to the image.
* Play with the parameter $D$ to see how it influences the ability to denoise the text. 

You can change the image to one of a noisy [aperiodic tiling](https://en.wikipedia.org/wiki/Einstein_problem) by modifying the initial conditions to use $I_S$ rather than $I_T$, and then restarting the simulation. 

Other images will also work, but these may need some fine-tuning to have this algorithm improve their quality. In particular, finer meshes may be needed to preserve small edges.
