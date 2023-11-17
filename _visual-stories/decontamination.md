---
layout: page
title: Cleaning up contaminants
lesson_number: 30
thumbnail: /assets/images/Decontamination.webp
extract: Chemical decontamination in porous media
equation:
---

In this Story, we’re interested in removing a contaminant from within a porous material by neutralising it in a chemical reaction. For example, the contaminant might be a hazardous liquid chemical that has seeped into a porous building material like concrete. 

To do this in practice, we apply a cleaning chemical to the surface of the concrete, and wait while it diffuses down into the concrete and neutralises the hazardous contaminant. It’s crucial to react away *all* the contaminant. Here, we say the decontamination is complete when there is no contaminant left anywhere in the material, which will correspond to the simulations going completely white.

# How long does it take?
The time taken to complete a decontamination depends on many things, including: 
* properties of the chemical, such as the chemical reaction rate, 
* physical parameters, including how deep the spill is, how saturated the material is, and how quickly the cleaning chemical can diffuse through the porous material from the surface where it is applied to where the contamination is.

The simulation below lets us explore the effect of one of these: the chemical reaction rate, which we'll call $k$. Clicking in the simulation adds a blob of cleansing chemical into the material. In reality, this is usually applied just to the upper surface (indicated by a thick black line), but here we can play around and add chemical to wherever we like. Try clicking to introduce cleanser, and watch as the contaminant is cleaned up. At any time, you can reset the simulation by pressing {{ layout.erase }}

<vpde-slider
    iframe="simA"
    name="k"
    label="$k$:"
    min="0"
    max="0.5"
    value="0.1"
    step="0.01"
></vpde-slider>

<iframe class="simA" src="/sim/?preset=DecontaminationDemoSpots&story" frameborder="0" loading="lazy"></iframe>

To explore the role that the reaction rate plays, try adjusting the slider found just above the simulation, and see what effect clicking has now. For larger rates, the reaction is faster, and this speeds up the overall decontamination of the concrete. 

However, there’s a limit to how much we can speed it up by just varying this one parameter: for very large $k$, the speed of cleaning is controlled by the rate of transport in the material, not $k$, so we can’t continue to reduce the decontamination time by further increasing $k$. 

You might also notice that for small $k$ the contaminant is reacted away quite evenly everywhere, whereas for large $k$ it only manages to clean small `pockets' of contaminant, leading to sharp boundaries separating the cleaned and contaminated regions.

# Making waves
The drop of liquid immediately disturbs the surface, causing ripples to quickly spread out and fill the container. As soon as the ripples hit the edge of the box, they reflect back and mix with any waves still heading towards the edges. Eventually, these reflected ripples collide with those bouncing off the opposite wall, leading to large peaks and deep troughs.

Curiously, after the ripples collide with one another, they seem to just carry on as if nothing had happened. In fact, the mathematics behind this type of waves tells us that this *always* happens. You can see this phenomenon at work when you throw multiple droplets into the water in rapid succession. You can try this out in real life, or you can press {{ layout.erase }} to reset the simulation and click in a few different places one after the other to try this out with VisualPDE in a water-free way. Regardless of which option you choose, you'll see the ripples pass right through each other, creating ever-changing patterns of overlapping circles. 

You might notice that, as time goes by, the ripples become less and less prominent, until they completely fade away. This is because the waves are losing energy all the time (due to friction and the slight stickiness of the water), leading to a smoother surface that will eventually become still again.

All the waves that we've made so far have been pretty small. To generate bigger, wider waves, keep your mouse/pointer clicked on the same spot for a few seconds and then let go. Now we get different, large-scale patterns emerging on the surface of the water, whose size comes close to the limits of the theory that we're using to simulate water waves with VisualPDE.

# Time for reflection
There is a lot left to explore about waves even in this simple-looking setting, such as investigating what happens when you click and drag? For now, we'll end this short exploration with something that's difficult to see in real life: perfect reflections in a circular container. In the simulation below, we've paused a simulation *just* as a drop of water hits the surface, precisely in the centre of a disc-shaped container. Press {{ layout.play }} to see ripples surge out from the disturbance and reflect simultaneously off the curved boundary, creating ever-more-complicated patterns that are (almost) perfectly symmetric. If you like chaos, you can break the symmetry by clicking anywhere to disturb the surface.

<iframe class="sim" src="/sim/?preset=ShallowWaterDisk&story" frameborder="0" loading="lazy"></iframe>

# Looking for more?
Not quite had enough of water waves? For a different perspective on this Visual Story, try pressing <span class='click_sequence'>{{ layout.views }} → **3D**</span> in either of the simulations above. What you'll see is the surface of the water drawn in 3D – try dragging to change the view, or clicking on the surface to disturb it, and experience a new point of view.

Enjoyed this Visual Story? We'd love to hear your feedback at [hello@visualpde.com](mailto:hello@visualpde.com).

Looking for more VisualPDE? Try out our other [Visual Stories](/visual-stories) or some mathematically flavoured content from [Basic PDEs](/basic-pdes).
