---
layout: page
title: Wessex Water tech demo
lesson_number: 110
thumbnail: /assets/images/flooding.webp
extract: Transport along rivers
equation:
---

<script src="/sim/scripts/charts.umd.min.js"></script>
<script src="/assets/js/vpde-charts.js"></script>

In this short demo, I've put together a range of components that illustrate various ways we might envisage a user interacting with a simple simulation of transport along a river (here written in terms of bacteria concentration, but this can be easily changed to other transported factors).

All styling and layout is incredibly basic and placeholder; I expect to spend a considerable amount of time tailoring the appearance of everything once we are happy with some content ideas.

## A very customisable simulation

The simulation below is a simple model of bacteria transport along a river. The user can change the initial concentration of bacteria at the inlet (LHS), the rate at which the bacteria decay, and the speed of the flow. The simulation is interactive, and the user can change the parameters using the sliders below the simulation.

It is possible (and straightforward) to have multiple simulations (with different parameters) running side-by-side. This could let us illustrate differences without having a user tweak sliders - perhaps useful for some topics?

<iframe class="sim" id="simA" src="/sim/?preset=bacteriaInAReach&story&lite&sf=1&clean&probing=true" frameborder="0" loading="lazy"></iframe>
<p style="text-align:center;margin-top:0;"><vpde-slider
    iframe="simA"
    name="c0"
    label="Inlet concentration"
    min="0.01"
    max="1"
    value="0.5"
    step="0.01"
    min-label="Low"
    max-label="High"
></vpde-slider></p>
<p style="text-align:center;margin-top:0;"><vpde-slider
    iframe="simA"
    name="k"
    label="Decay"
    min="0"
    max="0.02"
    value="0.001"
    step="0.0001"
    min-label="None"
    max-label="Maximum"
></vpde-slider></p>
<p style="text-align:center;margin-top:0;"><vpde-slider
    iframe="simA"
    name="u"
    label="Flow"
    min="0.1"
    max="2"
    value="0.62"
    step="0.01"
    min-label="Low"
    max-label="High"
></vpde-slider></p>

## Tracking quantities over time

We can track a range of quantities from the simulation over time in a separate chart. This could be, say, the concentration of bacteria at the outlet of the river over time, or the total amount of bacteria in the river etc. This allows us to e.g.

1. see how quickly the bacteria are flushed out of the river, and how this changes with flow speed,
1. talk about the source apportionment problem. For instance, we could have two side-by-side simulations with sources at different points upstream. They each generate downstream graphs, which would turn out to be the same but shifted in time. The big question to highlight here is how can we tell where the bacteria came from? There's no way to do this just from this information, so we are investing into research towards high-tech measurement devices that can take into account chemical markers to identify different sources, for instance.

<vpde-chart iframe="simA"> </vpde-chart>

## The science of prediction (flow rate only)

Rivers transport a variety of materials downstream, ranging from objects like rocks and stones down to chemicals (such as phosphorous) and bacteria. At Wessex Water, we actively monitor the amount of various materials in rivers, which allows us to provide guidance for public bathing, for instance.

A big scientific challenge we face is prediction: if we know some information about the river now, what can we say about the river after a few hours or days? Here, we've put together a simulation[^1] with [VisualPDE](https://visualpde.com) that lets us explore a key part of that challenge: flow rate.

In the box below, we're simulating the concentration of bacteria in a river from a source (left) as it is swept downstream (from left to right) by the flow. This is plotted on the vertical axis (higher is more) and also shown as colour.

<iframe class="sim" id="simA" src="/sim/?preset=bacteriaInAReach&story&lite&sf=1&clean&probing=true&colourbar=true" frameborder="0" loading="lazy"></iframe>

You can see that the amount of bacteria is decreasing as we go further along the river. This is because (some) bacteria decay when they are exposed to light; as the downstream bacteria have been exposed to light for longer than the upstream bacteria, those downstream have decayed more.

## The science of prediction (flow rate + decay)

[^1]: It is worth noting that, although the simulation on this page uses real science and mathematics, it isn't trying to match up perfectly with reality. So, we'll focus on general principles rather than precise predictions. If you want to see the mathematics and science behind this simulation, check out the [detailed article](https://visualpde.com) on [VisualPDE.com](https://visualpde.com).
