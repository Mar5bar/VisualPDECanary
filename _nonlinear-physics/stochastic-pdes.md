---
layout: page
title: "Stochastic Partial Differential Equations"
# permalink: /stochastic-pdes/
lesson_number: 120
thumbnail: /assets/images/stochastic-pdes.png
extract: Randomness in space and time
equation: $\pd{u}{t}=D\nabla^2 u +f(u)+\frac{dW_t}{dt}$
---


# Stochastic pattern formation

First we consider a stochastic version of the [Gray-Scott model](/nonlinear-physics/gray-scott) given by:

$$\begin{aligned}\pd{u}{t}&=\nabla^2 u+u^2v - (a+b)u+\sigma\diff{W_t}{t}u,\\ \pd{v}{t}&=D\nabla^2v-u^2v + a(1 - v),\end{aligned}$$

where $W_t$ is an approximation of a [Brownian sheet](https://en.wikipedia.org/wiki/Brownian_sheet), representing noise in both space and time, so its derivative is understood in the sense of [stochastic calculus](https://en.wikipedia.org/wiki/Stochastic_calculus).

* Load the interactive [stochastic reaction-diffusion model](/sim/?preset=StochasticGrayScott). 

* The model is initially deterministic ($\sigma=0$), so the initial condition simply spreads out to make a homogeneous state across the domain. Clicking indicates that this homogeneous equilibrium is stable, even to large perturbations.

* Increasing the value of $\sigma$ in the range $(0.1,0.2)$, we can observe that noise destabilizes this equilibrium, forming stripe and spot-like patterns. This is an example of [stochastic resonance](https://en.wikipedia.org/wiki/Stochastic_resonance) in reaction-diffusion systems. Smaller values of $\sigma$ will select for stripes, and larger for spots.

* Further increasing $\sigma$ to the value of $0.3$ or so will destroy these patterns, as the noise eventually destabilizes everything. This is sometimes known as stochastic extinction or random attractor collapse.


# Wave propagation through a random medium

First we consider a version of the [inhomogeneous wave equation](/basic-pdes/inhomogeneous-wave-equation) where the diffusion coefficient is a random function of space:

$$
\pdd{u}{t} = \vnabla \cdot \left (\eta(\v{x};\sigma) \vnabla u, \right),
$$

where $\eta(\v{x})$ is a smoothed spatial random variable approximated as a Gaussian with mean $1$ and variance which scales with $\sigma$. 

* Load the interactive [random wave equation](/sim/?preset=RandomWaveEquation). 

* Click to initiate a wave at some point in the domain.

* The default noise level is $\sigma=0.5$. If you change this value and restart the simulation by pressing {{ layout.restart }}, you can observe deterministic wave propagation for small values of $\sigma$, and noisier wave behaviour for larger values. 

# Stochastic vegetation waves 

Consider a stochastic version of the [Klausmeier model](/mathematical-biology/vegetation-patterns) in 1D of the form:

$$
\begin{aligned}
    \pd{n}{t} &= \pdd{n}{x} + w {n}^{2}-m n+\sigma \diff{W_t}{t} \left[n/\left(1+n\right)\right]\\
      \pd{w}{t} &= \pdd{w}{x} + a-w-w {n}^{2}+V \pd{w}{x}
    \end{aligned}
$$

* Load the interactive [stochastic Klausmeier model](/sim/?preset=StochasticKlausmeier). 

* The parameter $\sigma$ represents the strength of the noise, so increasing or decreasing it will lead to more stochastic/deterministic behaviour

* The noise function should scale correctly independently of the geometry and dimension. You can see how it behaves in 2D by pressing <span class='click_sequence'>{{ layout.settings }} ? **Domain**</span> and changing the Dimension from 1 to 2.

# Numerical health warning

Random and stochastic forcing can lead to less regularity and stability of numerical schemes. Importantly, \emph{our method only works for the Forward-Euler timestepping scheme!} All other timestepping schemes will not scale properly with the timestep. 

In implementing our random noise terms, we have taken

$$
\diff{W_t}{t} \propto \frac{1}{\sqrt{\dt \dx^N}}\xi(t,\v{x}),
$$

with $\dt$ and $\dx$ the space and time steps respectively, and $N$ is the number of dimensions. The variable $\xi$ represents (for each spatial point and every time step) an independently distributed Normal random variable with mean $0$ and variance $1$. The scaling in time is to preserve the Brownian increment scaling of $W_t \propto \sqrt{\dt}$ after the multiplication by $\dt$ from the Forward-Euler stepping. Similarly, we take $\eta$ to scale the same way in space, but it will not scale with time. We also mollify $\eta$ by running a diffusion smoothing on it for a short time. 