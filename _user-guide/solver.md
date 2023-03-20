---
layout: page
title: The VisualPDE solver
lesson_number: 20
thumbnail: /assets/images/UnderTheHood.png
extract: Under the hood of VisualPDE
---

VisualPDE aims to be a plug-and-play, browser-based solver and visualiser for a range of PDE systems, with as few barriers to entry as possible. Underneath what we hope is a polished exterior, we've made a number of somewhat technical choices to enable interactive and reliable solution across as many devices as we can support. To explain these choices, and because we like knowing what's going on inside any software we use, we've compiled a short summary of how VisualPDE works under the hood. Soon, this will be accompanied by a more detailed account in an open-access article.

We are always looking for ways to improve and extend VisualPDE, especially ways of reaching a broader audience and new communities. If you have any questions or suggestions about anything related to VisualPDE, we'd love to hear from you at [hello@visualpde.com](mailto:hello@visualpde.com)!

### The equations <a id='equations'>

### Spatial discretisation <a id='spatial-discretisation'>

### Timestepping <a id='timestepping'>

### Boundary conditions <a id='boundary-conditions'>

### Doing this in your browser, quickly <a id='browser'>
Solving PDEs is hard. To solve them in real time in your browser, VisualPDE gives all the hard work to the graphics chip (GPU) on your device, making use of [WebGL](https://en.wikipedia.org/wiki/WebGL) and a low-level shader language called [GLSL](https://en.wikipedia.org/wiki/OpenGL_Shading_Language).

Every time your browser requests a frame from VisualPDE (which might be up to 60 times per second), some [JavaScript](https://en.wikipedia.org/wiki/JavaScript) organises the solving of the discretised equations, displaying the solution, and incorporating anything you've drawn, which all happen on the GPU. Each frame, we typically perform hundreds of timesteps to give you a smooth experience, mitigating the limitations of our [Forward Euler solver](#timestepping). If you're interested in the finest details of the implementation, the source code for the entire site is freely available to view, reuse, and repurpose on [GitHub](https://github.com/Pecnut/visual-pde).