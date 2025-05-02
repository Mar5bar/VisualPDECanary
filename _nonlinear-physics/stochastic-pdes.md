---
layout: page
title: "Stochastic partial differential equations"
# permalink: /stochastic-pdes/
lesson_number: 120
thumbnail: /assets/images/stochastic-pdes.webp
extract: Randomness in time and space
equation: $\pd{u}{t}=D\nabla^2 u +f(u)+\frac{\mathrm{d}W_t}{\mathrm{d}t}$
categories: [patterns, waves, hyperbolic, parabolic]
---


# Stochastic pattern formation

We consider a stochastic version of the [Gray–Scott model](/nonlinear-physics/gray-scott) given by

$$\begin{aligned}\pd{u}{t}&=\nabla^2 u+u^2v - (a+b)u+\sigma\diff{W_t}{t}u,\\ \pd{v}{t}&=D\nabla^2v-u^2v + a(1 - v),\end{aligned}$$

where $W_t$ is an approximation of a [Brownian sheet](https://en.wikipedia.org/wiki/Brownian_sheet), representing noise in both space and time, so its derivative is understood in the sense of [stochastic calculus](https://en.wikipedia.org/wiki/Stochastic_calculus).

* Load the interactive [stochastic reaction–diffusion model](/sim/?preset=StochasticGrayScott).

* The model is initially deterministic ($\sigma=0$), so the initial condition simply spreads out to make a homogeneous state across the domain. Clicking indicates that this homogeneous equilibrium is stable, even to large perturbations.

* Increasing the value of $\sigma$ in the range $(0.1,0.2)$, we can observe that noise destabilises this equilibrium, forming stripe and spot-like patterns. This is an example of [stochastic resonance](https://en.wikipedia.org/wiki/Stochastic_resonance) in reaction–diffusion systems. Smaller values of $\sigma$ will select for stripes, while larger will give rise to spots.

* Further increasing $\sigma$ to around $0.3$ will destroy these patterns, as the noise eventually destabilises everything. This is sometimes known as stochastic extinction or random attractor collapse.


# Wave propagation through a random medium

Next we consider a version of the [inhomogeneous wave equation](/basic-pdes/inhomogeneous-wave-equation) where the diffusion coefficient is a random function of space,

$$
\pdd{u}{t} = \vnabla \cdot \left[\eta(\v{x},\sigma) \vnabla u \right],
$$

where $\eta(\v{x},\sigma)$ is a smoothed spatial random variable approximated as a Gaussian with mean $1$ and variance that scales with $\sigma$.

* Load the interactive [random wave equation](/sim/?preset=RandomWaveEquation).

* Click to initiate a wave at some point in the domain.

* The default noise level is $\sigma=0.5$. If you change this value and restart the simulation by pressing {{ layout.restart }}, you can observe deterministic wave propagation for small values of $\sigma$ and noisier wave behaviour for larger values.

# Stochastic vegetation waves

Consider a stochastic version of the [Klausmeier model](/mathematical-biology/vegetation-patterns) in 1D of the form:

$$
\begin{aligned}
    \pd{n}{t} &= \pdd{n}{x} + w {n}^{2}-m n+\frac{\sigma n}{n+1} \diff{W_t}{t},\\
      \pd{w}{t} &= \pdd{w}{x} + a-w-w {n}^{2}+V \pd{w}{x}.
    \end{aligned}
$$

* Load the interactive [stochastic Klausmeier model](/sim/?preset=StochasticKlausmeier).

* The parameter $\sigma$ represents the strength of the noise, so increasing or decreasing it will lead to more stochastic or more deterministic behaviour, respectively.

* The noise function should scale correctly independently of the geometry and dimension. You can see how it behaves in 2D by pressing <span class='click_sequence'>{{ layout.settings }} → **Domain**</span> and change **Dimension** from 1 to 2. Playing with $\sigma$ as well as other parameters, and clicking to perturb the waves, shows that irregularity of the waves can occur in different ways with stochastic forcing.

# Stochastic excitable wave propagation

Consider a stochastic version of the [FitzHugh–Nagumo model](/mathematical-biology/fitzhugh-nagumo) in 1D of the form:

$$
\begin{aligned}
   \pd{u_{1}}{t} &=  \pdd{u_{1}}{x} + u_{1} \left(1-u_{1}\right) \left(u_{1}-\beta\right)-u_{2}+\sigma u_{1} \diff{W_t}{t},\\
      \pd{u_{2}}{t} &= \gamma \left(\alpha u_{1}-u_{2}\right),
    \end{aligned}
$$

where we have added a multiplicative white noise term wit intensity $\sigma$.

* Load the interactive [stochastic FitzHugh–Nagumo model](/sim/?preset=NoisyFHN) where $u_1$ is plotted in colour and $u_2$ is plotted as a black curve.

* By default, the leftmost boundary oscillates to generate periodic travelling pulses. Clicking and holding introduces some of the inhibitor variable $u_2$ and, hence, one can destroy pulses by clicking on them.

* Increasing the value of $\sigma$ from the initial zero value will induce some noise in the traveling pulses. Above some threshold around $\sigma \approx 0.3$, pulses will no longer remain stable and will decay into the background.

# Numerical health warning

Randomness and stochastic forcing can lead to less regularity and stability of numerical schemes.

**Warning:** our approach only works for the forward Euler timestepping scheme! All other timestepping schemes will not scale properly with the timestep.

In implementing our random noise terms, we have taken

$$
\diff{W_t}{t} \propto \frac{1}{\sqrt{\dt \, \dx^N}}\xi(t,\v{x}),
$$

with $\dt$ and $\dx$ the space and time steps, respectively, and $N$ the number of dimensions. The variable $\xi$ represents (for each spatial point and every time step) an independently distributed normal random variable with mean $0$ and variance $1$. The scaling in time is to preserve the Brownian increment scaling of $W_t \propto \sqrt{\dt}$ after the multiplication by $\dt$ from the forward Euler stepping.

In the wave equation model we take $\eta$ to scale the same way in space, but it will not scale with time. We also mollify $\eta$ by running a diffusion smoothing on it for a short time.
