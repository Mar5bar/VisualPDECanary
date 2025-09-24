---
layout: page
title: Superlattice patterns
lesson_number: 140
thumbnail: /assets/images/Superlattice.webp
extract: Layering patterns of different kinds
equation: $\pdd{\mathbf{u}}{t} = \mathbf{D_u} \nabla^2 \mathbf{u} + \mathbf{f_u}(\mathbf{u}) + \alpha \mathbf{g}(\mathbf{u},\mathbf{v})\\ \pdd{\mathbf{v}}{t} = \mathbf{D_v} \nabla^2 \mathbf{v} + \mathbf{f_v}(\mathbf{v}) + \alpha \mathbf{g}(\mathbf{v},\mathbf{u})$
categories: [patterns, parabolic]
---


Coupling two systems that each generate spatial patterns can lead to what are referred to as "superlattice patterns." Here we showcase a [published example](https://journals.aps.org/pre/abstract/10.1103/PhysRevE.111.024210) with nonidentical kinetics. This model combines a Brusselator and a Lengyll-Epstein reaction-diffusion model, with a nonlinear coupling between the two subsystems. The full system is given by:

$$
\begin{aligned}
      \pd{u_{1}}{t} &= D_{u_{1}} \nabla^2 u_{1} + a-\left(b+1\right) u_{1}+{u_{1}}^{2} v_{1}+\alpha u_{1} u_{2} \left(u_{2}-u_{1}\right),\\
      \pd{v_{1}}{t} &= D_{u_{2}} \nabla^2 v_{1} + b u_{1}-{u_{1}}^{2} v_{1},\\
      \pd{u_{2}}{t} &= D_{u_{3}} \nabla^2 u_{2} + c - u_{2} -4 u_{2} v_{2}/\left(1+{u_{2}}^{2}\right)+\alpha u_{1} u_{2} \left(u_{1}-u_{2}\right),\\
      \pd{v_{2}}{t} &= D_{u_{4}} \nabla^2 v_{2} + d \left[u_{2} - u_{2} v_{2}/\left(1+{u_{2}}^{2}\right)\right],
\end{aligned}
$$

with $\alpha$ denoting the coupling parameter. In the simulations below, we vary only $\alpha$ and the four diffusion coefficients to observe a range of different behaviours.

<div style="text-align:center">
<vpde-select
      iframe="iframe"
      display-names="Holes and spots;Holes and stripes; Dynamic; Irregular holes and spots"
      parameters="a = 3, b = 9, c = 15, d = 9, alpha = 0.15, D_uone = 3.1, D_utwo = 13.95, D_uthree = 18.9, D_ufour = 670; a = 3, b = 9, c = 15, d = 9, alpha = 0.1, D_uone = 3.5, D_utwo = 10, D_uthree = 18.7, D_ufour = 550; a = 3, b = 9, c = 15, d = 9, alpha = 0.15, D_uone = 4.3, D_utwo = 50, D_uthree = 22, D_ufour = 660; a = 3, b = 9, c = 15, d = 9, alpha = 0.7, D_uone = 3.1, D_utwo = 13.95, D_uthree = 18.9, D_ufour = 670"
></vpde-select>
</div>
  

<iframe id="iframe" title="VisualPDE simulation" class="sim" style="margin-left:auto;margin-right:auto;margin-bottom:1em;margin-top:1em" src="/sim/?preset=Superlattice" frameborder="0"></iframe>

If you want to explore more, check out this [full-page simulation](/sim/?preset=Superlattice).