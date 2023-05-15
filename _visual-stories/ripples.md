---
layout: page
title: Ripples on a pond
lesson_number: 10
thumbnail: /assets/images/ShallowWaterBox.png
extract: Making waves in shallow water
equation:
---

Waves on water can be mesmerising, especially the ripples that spread out after an object breaks the surface of an otherwise still liquid. Using VisualPDE, we can play around with water waves without any risk of spillages.

Below you'll find a VisualPDE simulation set up to let us explore what happens when we press down on the surface of shallow water, just like a drop of water does as it hits the surface. Try clicking in the container to simulate a droplet landing in a still body of water. The colour tells us the height of the waves (bright is high, dark is low).

<iframe class="sim" src="/sim/?preset=ShallowWaterBox" frameborder="0"></iframe>

# Making waves
The drop of liquid immediately disturbs the surface, causing ripples to quickly spread out and fill the container. As soon as the ripples hit the edge of the box, they reflect back and mix with any waves still heading towards the edges. Eventually, these reflected ripples collide with those bouncing off the opposite wall, leading to large peaks and deep troughs.

Curiously, after the ripples collide with one another, they seem to just carry on as if nothing had happened. In fact, the mathematics behind this type of waves tells us that this *always* happens. You can see this phenomenon at work when you throw multiple droplets into the water in rapid succession. You can try this out in real life, or you can press {{ layout.erase }} to reset the simulation and click in a few different places one after the other to try this out with VisualPDE in a water-free way. Regardless of which option you choose, you'll see the ripples pass right through each other, creating ever-changing patterns of overlapping circles. 

You might notice that, as time goes by, the bright ripples become less bright and the dark ripples become less dark. This is because the waves are losing energy all the time (due to friction and the slight stickiness of the water), leading to a smoother surface that will eventually become still again.

All the waves that we've made so far have been pretty small. To generate bigger, wider waves, keep your mouse/pointer clicked on the same spot for a few seconds and then let go. Now we get different, large-scale patterns emerging on the surface of the water, whose size comes close to the limits of the theory that we're using to simulate water waves with VisualPDE.

# Time for reflection
There is a lot left to explore about waves even in this simple-looking setting, such as investigating what happens when you click and drag? For now, we'll end this short exploration with something that's difficult to see in real life: perfect reflections in a circular container. In the simulation below, we've paused a simulation *just* as a drop of water hits the surface, precisely in the centre of a disc-shaped container. Press {{ layout.play }} to see ripples surge out from the disturbance and reflect simulataneously off the curved boundary, creating ever-more-complicated patterns that are (almost) perfectly symmetric. If you like chaos, you can break the symmetry by clicking anywhere to disturb the surface.

<iframe class="sim" src="/sim/?preset=ShallowWaterDisk" frameborder="0"></iframe>

# Looking for more?
Not quite had enough of water waves? For a different perspective on this Visual Story, try pressing <span class='click_sequence'>{{ layout.settings }} → **Plotting**</span> and changing the **Plot type** from 'Plane' to 'Surface' in either of the simulations above. What you'll see is the surface of the water drawn in 3D - try dragging to change the view, or clicking on the surface to disturb it, and experience a new point of view.

Enjoyed this Visual Story? We'd love to hear your feedback at [hello@visualpde.com](mailto:hello@visualpde.com).

Looking for more VisualPDE? Try out our other [Visual Stories](/visual_stories) or some mathematically flavoured content from [Basic PDEs](/basic-pdes).
