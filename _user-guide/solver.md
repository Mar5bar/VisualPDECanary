---
layout: page
title: The VisualPDE solver
lesson_number: 20
thumbnail: /assets/images/UnderTheHood.png
extract: Under the hood of VisualPDE
---

<!-- Brief overview -->

### The equations <a id='equations'>

### Spatial discretisation <a id='spatial-discretisation'>

### Timestepping <a id='timestepping'>

### Boundary conditions <a id='boundary-conditions'>

### Doing this in your browser, quickly <a id='browser'>
Solving PDEs is hard. To solve them in real time in your browser, VisualPDE gives all the hard work to the graphics chip (GPU) on your device, making use of [WebGL](https://en.wikipedia.org/wiki/WebGL) and a low-level shader language called [GLSL](https://en.wikipedia.org/wiki/OpenGL_Shading_Language).

Every time your browser requests a frame from VisualPDE (which might be up to 60 times per second), some Javascript coordinates the solving of the discrete equations, displaying the solution, and incorporating anything you've drawn, which all happen on the GPU. Each frame, we typically perform hundreds of timesteps to give you a smooth experience, mitigating the limitations of our [Forward Euler solver](#timestepping). If you're interested in the finest details of the implementation, the source code for the entire site is freely available to view, reuse, and repurpose on [GitHub](https://github.com/Pecnut/visual-pde).

We are always looking for ways to improve and extend VisualPDE and would welcome any suggestions at [hello@visualpde.com](mailto:hello@visualpde.com)!
