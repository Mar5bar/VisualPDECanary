---
layout: page
title: Survival in a harsh environment
lesson_number: 20
thumbnail: /assets/images/harsh-environment.png
extract: What if we change boundary conditions?
equation: $\pd{u}{t}=\nabla^2 u+u\left(1-\frac{u}{K}\right)$<br />with no-flux boundary conditions
---
We'll continue studying the logistic reaction-diffusion model,

$$\pd{u}{t}=D\nabla^2 u+u\left(1-\frac{u}{K}\right),$$

but now we consider different boundary conditions.

* Load the [interactive simulation](/sim/?preset=harshEnvironment). The initial conditions leads to population growth in select areas of the domain, which eventually reach a large density and begin spreading. As the system initially has no-flux boundary conditions, the population will reach carrying capacity everywhere.

* Now change the boundary conditions to "Dirichlet", taking the constant value to be $0$. This will affect the solution near the domain edges, but not the interior, as the diffusion is small.

* Now increase the diffusion coefficient by deleting zeroes from the value of $D$. This will increase the region over which the boundary conditions affect the structure of the solution. 

* One can show that the positive equilibrium exists and is globally stable if and only if
$$
D < \frac{1}{2\pi^2} \approx 0.05066,
$$
and above this value the extinction equilibrium, $u=0$, is stable. Try simulating the system at $D=0.04$, and $D=0.06$, clicking if needed to introduce some additional population into the domain. NB: You can check the condition more precisely by looking at $D$ values closer to the boundary, but the timescale to reach equilibrium will be long, and the amplitude of $u$ will become very small.

* The analytical condition above does not depend on the carrying capacity $K$. Set $K=1000$, and simulate the system at $D=0.04$ and $D=0.06$ in this case to confirm that $K$ will not change the boundary of where the populations persists, though it will change the structure of the solution when $u>0$. Again you may need to click to introduce some population into the domain. With this value of $K$, it is easier to see the solution's behaviour near the critical diffusion threshold. The values $D=0.05$ and $D=0.052$ are good choices, for example.
