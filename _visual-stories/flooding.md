---
layout: page
title: Urban flooding
lesson_number: 40
thumbnail: /assets/images/flooding.webp
extract: Defending against surging rivers
equation:
categories: [visual stories]
---

In this Story, we'll explore the most frequent type of natural disaster: flooding. The prediction and prevention of flooding is difficult and far from solved, so we'll focus on visualising a caricature of a flood event rather than the real thing. 

We've picked the city of Oxford (UK) as our case study, as it often falls foul of flooding and 2/3 of the VisualPDE team have lived there. The river Thames flows around the city centre, which is surrounded by natural floodplains and houses. The image below shows part of the landscape just south of the city centre, shaded by height, and includes one of the team's old houses. There is a river in the upper right corner, a housing estate on the left, and fields in between.

<img class="center" style="width:70%;aspect-ratio:1;background-image:url('/assets/images/oxford-annotated-low.webp');background-size:cover;" src="/assets/images/oxford-annotated.webp" alt="Topographical map of an area south of Oxford city centre">
<small>Topographical LiDAR data from the [ARCHI MAPS UK website](https://www.archiuk.com); LiDAR tiles © Environment Agency copyright and/or database right 2022. All rights reserved.</small>

# Breaking the banks
Flooding has a huge economic and social impact. In the simulation below, we'll explore what happens when a surge in the river causes the area around it to flood. Clicking in the simulation mimics emptying a (very large) bucket of water onto the environment, which spreads out and eventually seeps away into the ground. After you've played around with clicking, drag the slider to the right to increase the flow rate of the river to the maximum.

<p style="text-align:center;margin-bottom:0;"><vpde-slider
    iframe="simA"
    name="r"
    label="Flow rate"
    label-position="above"
    min-label="Normal"
    max-label="Surge"
    min="0.01"
    max="2"
    value="0.01"
    step="0.01"
></vpde-slider></p>

<iframe id="simA" class="sim" style="margin-left:auto;margin-right:auto" src="/sim/?preset=floodingOxford&story&reset_only" frameborder="0" loading="lazy"></iframe>

The surging river quickly runs over the fields and encroaches on the road and the houses, eventually seeping down roads and into gardens and homes. But we can do more than explore a constantly surging river. Try resetting the simulation (or returning the flow to normal and waiting) and see what happens if you increase the flow and then decrease it again rapidly.

This time, the river still bursts its banks but only manages to spread over the fields, with little to no impact on homes beyond the road.

# Defending against flooding
There are many ways to prevent flooding. We'll use VisualPDE to explore the effects of two types of defence: 

* improving drainage into the ground,
* diverting flood water.

Naturally, our examples won't necessarily reflect the real thing, but they might help us see how these types of defence can be protective.

## Improving drainage
The simulation below lets us vary two things: the flow rate of the river (top slider) and the absorption of water into the ground (bottom slider). Try exploring what happens during a surge if we improve the drainage of water, fully increasing the absorption.

<p style="text-align:center;margin-bottom:0;"><vpde-slider
    iframe="simB"
    name="r"
    label="Flow rate"
    label-position="above"
    min-label="Normal"
    max-label="Surge"
    min="0.01"
    max="2"
    value="0.01"
    step="0.01"
></vpde-slider></p>

<iframe id="simB" class="sim" style="margin-left:auto;margin-right:auto" src="/sim/?preset=floodingOxford&story&reset_only" frameborder="0" loading="lazy"></iframe>

<p style="text-align:center;margin-bottom:0;"><vpde-slider
    iframe="simB"
    name="a"
    label="Absorption"
    label-position="below"
    min-label="Normal"
    max-label="Improved"
    min="0.001"
    max="0.02"
    value="0.001"
></vpde-slider></p>

Even at the maximum flow rate, fully improved drainage completely contains the flood within the fields, protecting the rest of the environment. Explore how reducing the level of improvement gradually causes more and more of the region to be flooded.

## Diverting flood water
An alternative to improving the absorption of the terrain is constructing channels that divert flood water away from at-risk areas. In the simulation below, clicking now carves deep trenches into the environment (much larger and deeper than real flood defences). Try drawing your own flood defence network and see if it holds water against a river surge.

<p style="text-align:center;margin-bottom:0;"><vpde-slider
    iframe="simC"
    name="r"
    label="Flow rate"
    label-position="above"
    min-label="Normal"
    max-label="Surge"
    min="0.01"
    max="2"
    value="0.01"
    step="0.01"
></vpde-slider></p>
<iframe id="simC" class="sim" style="margin-left:auto;margin-right:auto" src="/sim/?preset=floodingOxford&story&reset_only&whatToDraw=T&brushValue=-10&brushRadius=10" frameborder="0" loading="lazy"></iframe>

In our simulations of continuous high flow, the river almost always wins, filling up the trenches and spilling past towards the city. However, the defences can be very effective against shorter periods of high flow. Test this for yourself by only briefly increasing the flow rate.

# Looking for more?
Flooding is a complicated issue and we certainly haven't explored everything in this Story. Hopefully, however, we've seen how different types of management can help alleviate the effects of urban flooding. If you want to explore more water-based simulations on VisualPDE, try out our [page on the effects of topography](/mathematical-biology/topography) or our [Story exploring ripples on a pond](/visual-stories/ripples).

Enjoyed this Visual Story? We'd love to hear your feedback at [hello@visualpde.com](mailto:hello@visualpde.com). Many thanks to [Duncan Hewitt](https://www.damtp.cam.ac.uk/user/drh39/) for his help in bringing this Story to life.

Looking for more VisualPDE? Try out our other [Visual Stories](/visual-stories) or some mathematically flavoured content from the [VisualPDE library](/explore).