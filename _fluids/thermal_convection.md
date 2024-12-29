---
layout: page
title: "Thermal convection"
# permalink: /vorticity-equation/
lesson_number: 4
thumbnail: /assets/images/ThermalConvection.webp
extract: Instability and mixing
equation: $\pd{\omega}{t} = \nu \nabla^2 \omega - \pd{\psi}{y}  \pd{\omega}{x} +  \pd{\psi}{x}  \pd{\omega}{y}+\pd{b}{x}$, $0 = \nabla^2 \psi + \omega$, $\pd{b}{t} = \kappa \nabla^2 b -\left( \pd{\psi}{y}  \pd{b}{x} -  \pd{\psi}{x}  \pd{b}{y}\right)$
categories: [fluids, waves, parabolic]
---


Here we explore thermal convection in a 2D stratified Boussinesq model. We augment the [vorticity formulation](vorticity_equation) of fluid dynamics by adding a temperature field to arrive at

$$
\begin{aligned}
      \pd{\omega}{t} &= \nu \nabla^2 \omega - \pd{\psi}{y}  \pd{\omega}{x} +  \pd{\psi}{x}  \pd{\omega}{y}+ \pd{b}{x},\\
     \varepsilon \pd{\psi}{t} &= \nabla^2 \psi + \omega\\
      \pd{b}{t} &= \kappa \nabla^2 b -\left( \pd{\psi}{y}  \pd{b}{x} -  \pd{\psi}{x}  \pd{b}{y}\right),
    \end{aligned}
$$
    
where $b$ is the difference of the temperature from the top boundary, $\kappa$ is a thermal conductivity constant, and heating is provided at the bottom boundary via the parameter $T_b$.

* Load the interactive [boundary-driven convection model](/sim/?preset=thermalConvection). By default, the temperature perturbation $b$ is plotted.

* The heating at the lower boundary will become unstable to high-frequency perturbations, which will grow and coalesce into larger [Rayleigh–Bénard cells](https://en.wikipedia.org/wiki/Rayleigh%E2%80%93B%C3%A9nard_convection). You can also click to add a small region of warm air, which will then convect upwards.

* Different parameter values and initial conditions can lead to qualitatively-similar behaviour, but with different scales involved. Here is a [simulation with larger initial data](/sim/?preset=thermalConvectionInitialData) that undergoes the instability away from the boundary.

This page was suggested and written with the help of [Mathew Barlow](https://www.uml.edu/profile/mathew_barlow).

