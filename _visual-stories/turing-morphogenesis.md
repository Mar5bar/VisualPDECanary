---
layout: page
title: Turing's theory of pattern formation
lesson_number: 10
thumbnail: /assets/images/chemicalBasis.webp
extract: Exploring the chemical basis of morphogenesis
equation:
categories: [visual stories]
---

Alan Turing's theory of biological pattern formation, proposed in [The Chemical Basis of Morphogenesis](https://en.wikipedia.org/wiki/The_Chemical_Basis_of_Morphogenesis), is widely cited as a mechanism underlying a variety of periodic patterns throughout biology and chemistry. Here we will illustrate some aspects of this theory using interactive simulations carried out in the web browser on your device, as well as note some important extensions and caveats of these ideas. 

We start with a 'classical' reaction-diffusion Turing model, show a few examples of how the more general principle of local-activation and long-range inhibition (LALI) can also drive pattern formation beyond reaction-diffusion models, and then finally give a few examples where pattern formation occurs without LALI/Turing instabilities, or where Turing instabilities induce transient patterns that fade away on short timescales to another homogeneous state. *In summary, while LALI is a powerful framework for understanding biological patterning, it is neither necessary nor sufficient for patterning.*

In all of these examples, we provide some tunable parameters, and all of the simulations can be clicked to interact with the pattern by adding a small amount of the plotted variable (or, on a computer, right-clicked to take some of that variable away). At any time, you can reset the simulations by pressing {{ layout.erase }}, or click {{ layout.views }} to change what variable is being viewed (or modify colour scales or other visualization details). 

## Stripes and spots in reactin-diffusion models

Turing's theory proposes that a self-activating chemical species and a self-inhibiting species both react and diffuse in space, with the inhibitor diffusing much more rapidly. Depending on the nature of their interactions, including the details of the stoichiometry, these systems can undergo a symmetry-breaking instability whereby a spatially uniform state is destabilized into a patterned solution. 

These typically form stripe-like or spot-like structures which are stationary after they have formed, although in principle other kinds of two-dimensional patterns (such as holes, spirals, labyrinths, or spatiotemporal structures) are possible.

Below is an example simulation of a modified [Gierer-Meinhardt model](/mathematical-biology/gierer-meinhardt), with a modification whereby the activator kinetics can saturate based on the activator density. Initially, the model will form stripes due to the very small initial perturbation, and these will break up into spots. 

If the ratio between inhibitor and activator diffusion rates is decreased, the amplitude of the pattern will decay, eventually tending to a uniform state again as this ratio is decreased. You can also modify how much saturation the activator has to observe the transition from spots to stripes/labyrinths, although the pattern amplitude will also decay with increased saturation.

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

<p style="text-align:center;margin-bottom:0;"><vpde-slider
    iframe="simGM"
    name="K"
    label="Activator Saturation"
    label-position="below"
    min-label="None"
    max-label="Moderate"
    min="0"
    max="0.005"
    value="0"
></vpde-slider></p>

<iframe id="simGM" class="sim" style="margin-left:auto;margin-right:auto" src="/sim/?preset=GiererMeinhardtStripeiframe&story&nomathjax" frameborder="0" loading="lazy"></iframe>

<p></p>

## Patterning via chemotaxis

The basic notion of short-range activation and long-range inhibition also applies to many other pattern-forming models, such as the [Keller-Segel model](/mathematical-biology/keller-segel) of chemotaxis. Below is an example simulation of this model, with a tunable parameter controlling background cell growth kinetics. 

For essentially negligible cell growth, this model undergoes a Turing-like instability to form a spatial pattern of spots of high cell density. As the cell growth is increased, the pattern becomes more unstable, undergoing transitions between oscillatory spot and stripe-like behaviours, and eventually hole-like patterns, before the instability ceases to exist for sufficiently large growth. 

<p style="text-align:center;margin-bottom:0;"><vpde-slider
    iframe="simKS"
    name="r"
    label="Cell growth"
    label-position="above"
    min-label="Small"
    max-label="Moderate"
    min="0.001"
    max="0.3"
    value="0.001"
></vpde-slider></p>

<iframe id="simKS" class="sim" style="margin-left:auto;margin-right:auto" src="/sim/?preset=KellerSegeliframe&story&nomathjax" frameborder="0" loading="lazy"></iframe>

Importantly, there is also an aspect of hysteresis here, as one can only get patterned states for intermediate cell growth regimes if the cell growth is increased sufficiently slowly. If it is increased quickly, or decreased slowly after the system has gone to a spatially uniform state, very small deviations from uniformity will not grow.

<p></p>

## Pattern formation with differential flow

As another example of 'Turing-like' pattern formation, we also show the impact of [advection on pattern-forming systems](nonlinear-physics/advecting-patterns). Below is a variant of the [Gray-Scott](/nonlinear-physics/gray-scott) model with an advection term in the activator equation. 

This model has a Turing instability if the ratio between inhibitor and activator diffusion is sufficiently large. But you can also increase the flow velocity of the activator, which allows for the movement of patterns. 

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
    step="0.1"
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

Importantly, just the flow of the activator itself can allow for periodic (though moving) patterns, even if the ratio between activator and inhibitor is $1$ (i.e. one does not have the normal short-range activation and long-range inhibition). Such instabilities are sometimes referred to as flow-induced, rather than diffusion-driven; see [this paper](https://doi.org/10.1017/jfm.2019.620) for a wide view on the linear analysis of how such instabilities interact.

<p></p>



## Pattern formation without an inhibitor (No Turing instabilities)


Here is a system without a self-inhibitor that cannot undergo Turing instabilities (a spatial version of the [Bazykin-Berezovskaya population model](https://www.worldscientific.com/worldscibooks/10.1142/2284#t=aboutBook)). This model cannot have a Turing-like instability, yet can form patterned solutions.

The mechanism of pattern-formation here is not as well-studied, as it is more challenging theoretically, but involves a diffusion-driven instability of a spatially-uniform oscillating state. Here, the parameter labelled 'self-activation' determines the relative strength of the activator compared with its interaction to the other variable. 

If this is changed sufficiently slowly, one can see various transitions in the pattern which show transient oscillations due to the nature of the underlying oscillatory system. Fast movement of this variable can annihilate the pattern entirely, which will reform in rather intricate ways but typically tends towards a domain-filling labyrinthine state.

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

<p></p>

## Pattern formation with equal transport coefficients

The notions of Turing instabilities and short-range activation long-range inhibition have been extended to reaction-diffusion systems with more than two-components. However, these systems can also undergo a variety of other complex behaviours, and they still require some kind of *differential transport* to induce patterning instabilities. Here we give an example of a system that has equal diffusion coefficients, but exhibits spatiotemporal pattern formation in the form of spiral waves. 

These arise due to a complex but symmetric rock-paper-scissors dynamic between the three species, sometimes described in the literature as [cyclic competition](/mathematical-biology/cyclic-competition) in a generalised Lotka-Volterra system. Note: You can click to perturb this system into forming these patterns, or view a [wave-initiation of patterns here](/sim/?preset=cyclicCompetitionWave).


<iframe id="simED" class="sim" style="margin-left:auto;margin-right:auto" src="/sim/?preset=CyclicCompetitionWaveiframe&story&nomathjax" frameborder="0" loading="lazy"></iframe>


<p></p>


## Turing instabilities are not enough to ensure pattern formation

Finally, we link to [three examples of systems that undergo Turing instabilities, but fail to form stationary patterns](/mathematical-biology/Turing-conditions-are-not-enough). The models on that page show that, despite LALI and Turing instabilities existing in large classes of models supposing different mechanisms, these frameworks are not sufficient to ensure the formation of patterns outside short-lived transients. This emphasises a key role in constraining the nonlinearities in modelling.
