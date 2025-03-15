---
layout: page
title: "Spatial resilience in cancer immunotherapy"
lesson_number: 140
thumbnail: /assets/images/TuringNotEnough.webp
extract: Turing patterns in cancer
equation: $\pd{u}{t} = \delta_{u} \nabla^2 u + \alpha v-\mu_{u} u+\rho_{u} u w/\left(1+w\right)+\sigma_{u}+K_{u} t$, $\pd{v}{t} = \nabla^2 v + v \left(1-v\right)-u v/\left(\gamma_{v}+v\right)$, $\pd{w}{t} = \delta_{w} \nabla^2 w + \rho_{w} u v/\left(\gamma_{w}+v\right)-\mu_{w} w+\sigma_{w}+K_{w} t$
categories: [biology, patterns, parabolic]
---



$$
\begin{aligned}
    \pd{u}{t} &= \delta_{u} \nabla^2 u + \alpha v-\mu_{u} u+\rho_{u} u w/\left(1+w\right)+\sigma_{u}+K_{u} t\\
    \pd{v}{t} &= \nabla^2 v + v \left(1-v\right)-u v/\left(\gamma_{v}+v\right)\\
    \pd{w}{t} &= \delta_{w} \nabla^2 w + \rho_{w} u v/\left(\gamma_{w}+v\right)-\mu_{w} w+\sigma_{w}+K_{w} t
    \end{aligned}
$$


This [Keller--Segel simulation](/sim/?preset=TuringNotEnoughKellerSegel) corresponds to the equations
