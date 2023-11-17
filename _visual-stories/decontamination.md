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

The simulation below lets us explore the effect of one of these factors: the chemical reaction rate, which we'll call $k$. Clicking in the simulation adds a blob of cleansing chemical into the material. In reality, this is usually applied just to the upper surface (indicated by a thick black line), but here we can play around and add chemical to wherever we like. Try clicking to introduce cleanser, and watch as the contaminant is cleaned up. At any time, you can reset the simulation by pressing <vpde-reset iframe="simA"></vpde-reset>

<p style="text-align:center;"><vpde-slider
    iframe="simA"
    name="k"
    label="$k$:"
    min="0.01"
    max="0.5"
    value="0.1"
    step="0.01"
></vpde-slider></p>

<iframe id="simA" class="sim" src="/sim/?preset=DecontaminationDemoSpots&story&no_ui" frameborder="0" loading="lazy"></iframe>

To explore the role that the reaction rate plays, try adjusting the slider found just above the simulation, and see what effect clicking has now. For larger rates, the reaction is faster, and this speeds up the overall decontamination of the concrete. 

However, there’s a limit to how much we can speed it up by just varying this one parameter: for very large $k$, the speed of cleaning is controlled by the rate of transport in the material, not $k$, so we can’t continue to reduce the decontamination time by further increasing $k$. 

You might also notice that for small $k$ the contaminant is reacted away quite evenly everywhere, whereas for large $k$ it only manages to clean small `pockets' of contaminant, leading to sharp boundaries separating the cleansed and contaminated regions.

# How much cleanser do we need?
In practice, an easy way to speed up the cleaning process is to add more cleanser. The following pair of simulations let us see this in action. In each, we're applying cleanser to the top of the concrete, but the simulation on the right is at double strength. Restart the process to get another look by pressing <vpde-reset iframe="simB simC"></vpde-reset>

<div style="display:flex">
<!-- Invisible sliders to set values in simulation -->
<vpde-slider style="display:none" iframe="simB" name="BC" value="1"></vpde-slider>
    <iframe id="simB" class="sim" style="width:40%" src="/sim/?preset=DecontaminationDirichlet&story&no_ui" frameborder="0" loading="lazy"></iframe>
<vpde-slider style="display:none" iframe="simC" name="BC" value="2"></vpde-slider>
    <iframe id="simC" class="sim" style="width:40%" src="/sim/?preset=DecontaminationDirichlet&story&no_ui" frameborder="0" loading="lazy"></iframe>
</div>


# Looking for more?
Not quite had enough of water waves? For a different perspective on this Visual Story, try pressing <span class='click_sequence'>{{ layout.views }} → **3D**</span> in either of the simulations above. What you'll see is the surface of the water drawn in 3D – try dragging to change the view, or clicking on the surface to disturb it, and experience a new point of view.

Enjoyed this Visual Story? We'd love to hear your feedback at [hello@visualpde.com](mailto:hello@visualpde.com).

Looking for more VisualPDE? Try out our other [Visual Stories](/visual-stories) or some mathematically flavoured content from [Basic PDEs](/basic-pdes).
