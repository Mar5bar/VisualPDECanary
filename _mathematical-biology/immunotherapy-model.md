---
layout: page
title: "Spatial resilience in cancer immunotherapy"
lesson_number: 140
thumbnail: /assets/images/Immunotherapy.webp
extract: Turing patterning affects cancer treatment
equation: $\pd{u}{t} = \delta_{u} \nabla^2 u + \alpha v-\mu_{u} u+\frac{\rho_{u} u w}{1+w}+\sigma_{u}+K_{u} t$ $\pd{v}{t} = \nabla^2 v + v \left(1-v\right)-\frac{u v}{\gamma_{v}+v}$ $\pd{w}{t} = \delta_{w} \nabla^2 w + \frac{\rho_{w} u v}{\gamma_{w}+v}-\mu_{w} w+\sigma_{w}+K_{w} t$
categories: [biology, patterns, parabolic]
---

On this page we explore the following model of cancer immunotherapy:

$$
\begin{aligned}
    \pd{u}{t} &= \delta_{u} \nabla^2 u + \alpha v-\mu_{u} u+\frac{\rho_{u} u w}{1+w}+\sigma_{u}+K_{u} t,\\
    \pd{v}{t} &= \nabla^2 v + v \left(1-v\right)-\frac{u v}{\gamma_{v}+v},\\
    \pd{w}{t} &= \delta_{w} \nabla^2 w + \frac{\rho_{w} u v}{\gamma_{w}+v}-\mu_{w} w+\sigma_{w}+K_{w} t,
    \end{aligned}
$$

where $u$ measures the density of effector (immunotherapeutic) cells, $v$ the density of cancer cells, and $w$ the concentration of IL-2 compounds, which stimulate the effector cells' response to cancer. All other (positive) parameters correspond to interactions between these three components of the model, with the two $\sigma$ and $K$ variables in particular playing the role of applied immunotherapeutic treatment. By default we consider Neumann boundary conditions for all species except where this is changed below. These simulations complement [this paper](https://arxiv.org/abs/2503.20909), which overall demonstrates the impact of spatial pattern formation on tumour resistance to treatment.

* Load the [interactive simulation](/sim/?preset=ImmunotherapyCircleNeumann) which shows the influence of increasing effector cells over time ($K_u>0$, $K_w=0$) on the persistence of the cancer density $v$ which is plotted in a circular domain, with the mean cancer cell density given in the time series at the bottom-left of the screen.

* In this simulation, a Turing instability occurs before $t=150$, leading to a dip in the cancer cell density but overall persistence. To see this, you can either set $\eta=0$, which controls the spatial noise applied to the initial condition, or set $\delta_u=1$. In both cases, the system will never become Turing unstable, and instead the cancer will become extinct before $t=150$.

* All of the parameters in this model can be modified, including the geometry, to explore other treatment regimes. For example, considering $\sigma_u=0.015$ and decreasing $K_u$ to half of its value (setting $K_u=0.00005$), leads to qualitatively similar dynamics, but with a slower transition of the pattern from holes, to stripes, to spots. Again one can observe significant differences in the persistence of the cancer depending on if spatial patterning occurs or not.

# Varying treatment & hysteresis

The terms $\sigma_w$ and $K_w$ allow for a constant and a linear (in time) treatment respectively. A more realistic model of IL-2 treatment would be to ramp up treatment to a maximum sustained dose, and then ramp it down to no treatment. In [this time-varying treatment simulation](/sim/?preset=ImmunotherapyCircleHysteresis), we implement this by linearly increasing a source of $w$ until $t=200$, and then linearly decreasing the source back to $0$ by $t=400$. This leads to an almost-elimination of the tumour, but small remnants can regrow due to patterned regions of the tumour. Interestingly, there is a kind of hysteresis where the final state is an inhomogeneous pattern, rather than the initial stable homogeneous state that was started with, despite the parameters for $t>400$ being equivalent to the initial untreated system.

You can also compare this treatment to parameters that do not form patterns by setting $\delta_u=10$ or lower and restarting the simulation with {{ layout.restart }}. In this case, the tumour is eliminated well before the maximal dose is reached, approximately at $t=75$.

# Boundary-driven treatment

The implementation of treatment above (modifying the $\sigma$ or $K$ values) assumes we can input effector cells or IL-2 compounds directly into the domain where the tumour resides. A more realistic model would instead introduce immunotherapy through the boundaries. In this [boundary-treatment simulation](/sim/?preset=ImmunotherapySquareDirichlet), we specify a Dirichlet condition of the form $w=B_w t$ on the IL-2 compound. For these parameters, the spatially homogeneous equilibrium is stable (including to Turing modes) for Neumann conditions, but that the increasing presence of $w$ induces a spatial structure which becomes a periodic/Turing-type pattern over time. Eventually, the source of $w$ on the boundaries can eliminate the tumour, but only when the boundary-induced treatment is very high. If you set $\delta_u=10$, and restart the simulation with {{ layout.restart }} you can see how this compares to a case without this patterning potential. While a spatial structure does emerge (due to the emergent heterogeneity in $w$ from the boundary conditions), no internal Turing-like pattern forms within the tumour, and instead the cancer is eliminated more quickly.
