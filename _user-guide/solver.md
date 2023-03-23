---
layout: page
title: The VisualPDE solver
lesson_number: 30
thumbnail: /assets/images/UnderTheHood.png
extract: Under the hood of VisualPDE
---

VisualPDE aims to be a plug-and-play, browser-based solver and visualiser for a range of PDE systems, with as few barriers to entry as possible. Underneath what we hope is a polished exterior, we've made a number of somewhat technical choices to enable interactive and reliable solution across as many devices as we can support. To explain these choices, and because we like knowing what's going on inside any software we use, we've compiled a short summary of how VisualPDE works under the hood. Soon, this will be accompanied by a more detailed account in an open-access article.

We are always looking for ways to improve and extend VisualPDE, especially ways of reaching a broader audience and new communities. If you have any questions or suggestions about anything related to VisualPDE, we'd love to hear from you at [hello@visualpde.com](mailto:hello@visualpde.com)!

### The equations <a id='equations'>
VisualPDE can solve a variety of PDE systems posed in 2D space, many of which are straightforward extensions of the two-species reaction–diffusion system,

$$\begin{aligned}
    \textstyle \pd{u}{t} &= \vnabla \cdot(D_u\vnabla u) + f,\\
    \textstyle \pd{v}{t} &= \vnabla \cdot(D_v\vnabla v) + g.
\end{aligned}$$

Here, $u$ and $v$ are the scalar fields that we solve for, $t$ is time, and the divergence and gradient operators are the usual spatial operators in a 2D Euclidean domain. In general, the reaction kinetics ($f$ and $g$) and the diffusion coefficients ($D_u$ and $D_v$) can each be functions of time, space, and the scalar fields, though we often don't explicitly write these potential dependencies.

### The domain <a id='domain'>
A PDE problem is not well-posed without specifying a domain (or [boundary conditions](#boundary-conditions)). We typically determine the domain $\domain$ from the size of your device, fixing the largest side to be of length $L$ and maintaining an aspect ratio of 1:1. As most screens are not square, we also provide a toggle under <span class='click_sequence'>{{ layout.settings }} → **Domain** → **Square**</span> just in case we want to have a square domain.

However, not all domains are rectangular. 

### Spatial discretisation <a id='spatial-discretisation'>
If $D_u$ and $D_v$ were simply constants, as they were when we began the development of VisualPDE, a [central differences discretisation](https://en.wikipedia.org/wiki/Discrete_Laplace_operator) of the resulting Laplacian $\nabla^2$ would suffice.

### Timestepping <a id='timestepping'>

Overall, our core numerical approach closely resembles the somewhat obtusely named [FTCS](https://en.wikipedia.org/wiki/FTCS_scheme) scheme, where our finite difference stencil for the spatial discretisation is complicated by allowing the diffusion coefficients to be non-constant.

### Boundary conditions <a id='boundary-conditions'>
VisualPDE implements four types of boundary condition: periodic, [Dirichlet](https://en.wikipedia.org/wiki/Dirichlet_boundary_condition), [Neumann](https://en.wikipedia.org/wiki/Neumann_boundary_condition), and [Robin](https://en.wikipedia.org/wiki/Robin_boundary_condition). As each of these are slightly different in character, we briefly describe the general form of each condition that can be used in VisualPDE, along with notes on how this is enforced in the simulation.

#### Periodic


<!-- For those conditions that involve spatial derivatives (Neumann and Robin), we make use of **ghost nodes** in our discretisation to enforce the boundary conditions. For instance, enforcing the exemplar Neumann condition stated above at the left-most $x$ boundary is achieved in practice by taking $u(-\dx,y) = u(\dx,y)$ in the spatial finite difference operator described [above](#spatial-discretisation). -->

### Doing this in your browser, quickly <a id='browser'>
Solving PDEs is hard. To solve them in real time in your browser, VisualPDE gives all the hard work to the graphics chip (GPU) on your device, making use of [WebGL](https://en.wikipedia.org/wiki/WebGL) and a low-level shader language called [GLSL](https://en.wikipedia.org/wiki/OpenGL_Shading_Language).

Every time your browser requests a frame from VisualPDE (which might be up to 60 times per second), some [JavaScript](https://en.wikipedia.org/wiki/JavaScript) organises the solving of the discretised equations, displaying the solution, and incorporating anything you've drawn, which all happen on the GPU. Each frame, we typically perform hundreds of timesteps to give you a smooth experience, mitigating the limitations of our [forward Euler solver](#timestepping). If you're interested in the finest details of the implementation, the source code for the entire site is freely available to view, reuse, and repurpose on [GitHub](https://github.com/Pecnut/visual-pde).