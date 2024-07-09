---
layout: page
title: "Dipoles in potential flow"
lesson_number: 30
thumbnail: /assets/images/dipole.webp
extract: Playing with dipoles
equation: $\nabla^2 \phi = f,$ $(u,v) = \vnabla \phi$
categories: [fluids]
---

In many fields, singularity solutions are commonplace. In 2D potential flows, singularity solutions representing point forces, vortices, sources and sinks occur all the time, often as approximations of more complex flow features. A flow field might include any number of these added together, yielding an intricate flow field.

But what happens if we bring two of these singularity solutions close together? This is an especially interesting question when they are equal and opposite, like a source and a sink or two opposing forces.

# Deriving dipoles

When we bring two opposites together, this is often called a [dipole](https://en.wikipedia.org/wiki/Dipole)[^1]. For instance, two forces make a *force dipole* and a source-sink pair make a *source dipole*. For instance, the equation for a potential $\phi$ with a source-sink pair is

$$\nabla^2 \phi = Q\delta(x-d,y) - Q\delta(x+d,y),$$

where $2d$ is their separation, $Q$ is their strength and $\delta$ is the [Dirac delta function](https://en.wikipedia.org/wiki/Dirac_delta_function).

This corresponds to a dipole if we take the limit as $d\to0$ and $Q\to\infty$ as $dQ$ stays constant. If this feels like we're taking some sort of derivative, that's because we are!

We'll leave the fine details for the textbooks and explore this through some simulations. We've set up a source in an [interactive simulation](/sim/?preset=potentialFlowDipoleClick). Try clicking to place down a sink and get a feel for the flow between them.

To capture the limiting process of dipole formation more carefully, we've set up a simulation below for some value of $d$. Try varying this parameter using the slider to see how the flow field changes as we take the limit holding $dQ$ constant. For larger $d$, this gives you an idea of what real systems look like, where $d$ is not identically zero.

<iframe class="sim" id="sim" src="/sim/?preset=potentialFlowDipoleSlider&story&lite&sf=1&clean" frameborder="0" loading="lazy"></iframe>
<p style="text-align:center;margin-top:0;"><vpde-slider
    iframe="sim"
    name="d"
    label="$d$"
    min="1"
    max="30"
    value="5"
    step="1"
    min-label="Low"
    max-label="High"
></vpde-slider></p>

You can also check out the [full-screen version](/sim/?preset=potentialFlowDipoleSlider) of this simulation to play more.


### Footnotes

[^1]: Wikipedia talks about these in the context of electrostatics and magnetism, but the principle is the same for fluids.