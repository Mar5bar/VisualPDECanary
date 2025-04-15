---
layout: page
title: Turing's theory of pattern formation
lesson_number: 10
thumbnail: /assets/images/chemicalBasis.webp
extract: Exploring the chemical basis of morphogenesis
equation:
categories: [visual stories]
---

Alan Turing's theory of biological pattern formation, proposed in [The Chemical Basis of Morphogenesis](https://en.wikipedia.org/wiki/The_Chemical_Basis_of_Morphogenesis), is widely cited as a mechanism underlying a variety of periodic patterns throughout biology and chemistry. Here we will illustrate some aspects of this theory using interactive simulations carried out in the web browser on your device, as well as note some important extensions and caveats of these ideas. In all of the examples below, we provide some tunable parameters, and all of the simulations can be clicked to interact with the pattern by adding a small amount of the plotted variable (or, on a computer, right-clicked to take some of that variable away). Links to full simulations and further reading are provided throughout. TODO: THIS NEEDS SOME WORK.

# Stripes and spots

Turing's theory proposes that a self-activating chemical species and a self-inhibiting species both react and diffuse in space, with the inhibitor diffusing much more rapidly. Depending on the nature of their interactions, including the details of the stoichiometry, in two spatial dimensions these systems can undergo a symmetry-breaking instability whereby a spatially uniform state is destabilized into a patterned solution. These typically form stripe-like or spot-like structures which are stationary after they have formed, although in principle other kinds of two-dimensional patterns (such as holes, spirals, labyrinths, or spatiotemporal structures) are possible.

Below is an example simulation of a modified [Gierer-Meinhardt model](/mathematical-biology/gierer-meinhardt), with a modification whereby the activator kinetics can saturate based on the activator density. Initially, the model will form stripes due to the very small initial perturbation, and these will break up into spots. If the ratio between inhibitor and activator diffusion rates is decreased, the amplitude of the pattern will decay, eventually tending to a uniform state again as this ratio is decreased. You can also modify how much saturation the activator has to observe the transition from spots to stripes/labyrinths, although the pattern amplitude will also decay with increased saturation At any time, you can reset the simulation by pressing <vpde-reset iframe="simA"></vpde-reset>.

<p style="text-align:center;margin-bottom:0;"><vpde-slider
    iframe="simGM"
    name="D"
    label="Ratio of inhibitor to activator diffusion"
    label-position="above"
    min-label="Small"
    max-label="Large"
    min="40"
    max="100"
    value="100"
    step="5"
></vpde-slider></p>

<iframe id="simGM" class="sim" style="margin-left:auto;margin-right:auto" src="/sim/?preset=GiererMeinhardtStripeiframe&story&nomathjax" frameborder="0" loading="lazy"></iframe>

<p style="text-align:center;margin-bottom:0;"><vpde-slider
    iframe="simGM"
    name="K"
    label="Activator Saturation"
    label-position="below"
    min-label="Normal"
    max-label="Improved"
    min="0"
    max="0.005"
    value="0"
></vpde-slider></p>


# Patterning via chemotaxis

The basic notion of short-range activation and long-range inhibition also applies to many other pattern-forming models, such as the [Keller-Segel model](/mathematical-biology/keller-segel) of chemotaxis. Below is an example simulation of this model, with a tunable parameter controlling background cell growth kinetics. For essentially negligible cell growth, this model undergoes a Turing-like instability to form a spatial pattern of spots of high cell density. As the cell growth is increased, the pattern becomes more unstable, undergoing transitions between oscillatory spot and stripe-like behaviours, and eventually hole-like patterns, before the instability ceases to exist for sufficiently large growth.

<p style="text-align:center;margin-bottom:0;"><vpde-slider
    iframe="simKS"
    name="r"
    label="Cell growth"
    label-position="above"
    min-label="Small"
    max-label="Moderate"
    min="0.1"
    max="1"
    value="1"
></vpde-slider></p>

<iframe id="simKS" class="sim" style="margin-left:auto;margin-right:auto" src="/sim/?preset=KellerSegeliframe&story&nomathjax" frameborder="0" loading="lazy"></iframe>



# Pattern Formation without an Inhibitor (No Turing instabilities)

Here is a system without a self-inhibitor that cannot undergo Turing instabilities. TODO: REFERENCE EQUATIONS/MODEL. 


<p style="text-align:center;margin-bottom:0;"><vpde-slider
    iframe="simLC"
    name="r"
    label="Self-activation"
    label-position="above"
    min-label="Small"
    max-label="Moderate"
    min="0.1"
    max="1"
    value="1"
></vpde-slider></p>

<iframe id="simLC" class="sim" style="margin-left:auto;margin-right:auto" src="/sim/?preset=PatterningViaLimitCycles&story&nomathjax" frameborder="0" loading="lazy"></iframe>



# Pattern Formation with Equal Transport Coefficients
Lorem ipsum
Lorem ipsum
Lorem ipsum
Lorem ipsum
Lorem ipsum
Lorem ipsum
Lorem ipsum
Lorem ipsum
Lorem ipsum
Lorem ipsum


<iframe id="simED" class="sim" style="margin-left:auto;margin-right:auto" src="/sim/?preset=cyclicCompetitionWave&story&nomathjax" frameborder="0" loading="lazy"></iframe>


# Pattern Formation with Differential Flow

<p style="text-align:center;margin-bottom:0;"><vpde-slider
    iframe="simGSA"
    name="D"
    label="Ratio of inhibitor to activator diffusion"
    label-position="above"
    min-label="Small"
    max-label="Large"
    min="1"
    max="4"
    value="2"
    step="0.4"
></vpde-slider></p>

<p style="text-align:center;margin-bottom:0;"><vpde-slider
    iframe="simGSA"
    name="V"
    label="Activator Flow Velocity"
    label-position="below"
    min-label="Normal"
    max-label="Improved"
    min="0"
    max="0.3"
    value="0"
    step="0.05"
></vpde-slider></p>

<iframe id="simGSA" class="sim" style="margin-left:auto;margin-right:auto" src="/sim/?preset=GrayScottiframeAdvection&story&nomathjax" frameborder="0" loading="lazy"></iframe>


