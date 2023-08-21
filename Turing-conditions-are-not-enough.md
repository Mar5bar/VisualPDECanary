# Turing Conditions are Not Enough to Ensure Pattern Formation

Linear stability thery is often used to predict regions of pattern-forming (or `Turing') instabilities. However, in the presence of multiple homogeneous equilibria, these instabilities do not guarantee that a system develops a pattern. Here we implement interactive versions of the three spatially local models in the paper, ``Turing conditions are not enough to ensure pattern formation." In each case, the default is a 2D spatial domain with periodic boundary conditions. The boundary conditions can be modified by clicking <span class='click_sequence'>{{ layout.equations }} → **Boundary conditions**</span>, and the domain can be changed to a 1D interval by clicking <span class='click_sequence'>{{ layout.settings }} → **Domain**</span> and selecting the dimension.

* The [reaction-diffusion simulation](/sim/?preset=TuringNotEnoughRD) given by the system

$$\begin{aligned}\pd{u}{t}&=\nabla^2 u+u-v-eu^3,\\ \pd{v}{t}&=D\nabla^2 v+ a v(v + c)(v - d) +  b u - e v^3.\end{aligned}$$

* The [Keller-Segel chemotaxis simulation](/sim/?preset=TuringNotEnoughKellerSegel) corresponging to the equations

$$
\pd{u}{t} &=  \nabla^2 u - c\vnabla \cdot(u\vnabla v) +u(b - u)(u - d),\\
\pd{v}{t} &= D \nabla^2 v + u-av.
$$

* The [Biharmonic simulation](/sim/?preset=TuringNotEnoughBiharmonic) given by the equation,

$$
\pd{u}{t} = - D\nabla^2 u -  \nabla^4 u + au(c - u)(u - b).
$$
