---
layout: page
title: Virus transmission
lesson_number: 20
thumbnail: /assets/images/ShallowWaterBox.png
extract: Visualising airborne infections
equation:
---

<!-- virus conc in a still room. Click to simulate a cough -->

<iframe class="sim" src="/sim/?preset=CovidInAStillRoom&story" frameborder="0"></iframe>

<!-- virus probability is another way of viewing things. Caveat of only illustrative numbers here -->

Whilst looking at the virus concentration can be helpful, we might also be interested in looking at the probability of infection if you'd been stood at a particular location for the duration of the simulation. With VisualPDE, we can switch to the Probability View by pressing {{ layout.views }} and choosing 'Probability', though it's worth noting that these numbers aren't meant to match up perfectly with reality here.

Here, the probability of being infected is only large close to where we know the source of the infection is, right in the middle of the room. As you might expect, the probability of being infected increases with the amount of time that you're exposed to the virus. This time-dependent effect is visible when you click to cough whilst using the Probability View. To reset the simulation, press {{ layout.erase }}

# Recirculation
It's fairly rare for air to stay still. Let's see what effect the movement of air can have on the distribution of virus and the chance of infection. In the simulation below, we've added in the effects of the air being blown from left to right, mimicking an air conditioner, with anything that reaches the right-hand side of the room being recycled back into left side.

<iframe class="sim" src="/sim/?preset=CovidInARoom&story" frameborder="0"></iframe>

With this new air movement, it looks like standing downwind of the infected person is a bad idea: particles of the virus are swept from left to right by the air current, and the probability of being infected is much higher on the right of the infected person. Remember you can swap between Views to see the effects on both Probability and Concentration. Try clicking whilst viewing the Concentration to really see how the air drives the spread of the virus in one direction.

# A meandering infection
It's also rare for people to stay still. Unsurprisingly, the movement of an infected individual can have a big impact on the spread of a virus. In the next simulation, we've set it up so that the source of the infection moves around the room, as if they were a waiter going between tables in a restaurant. We've also turned off the air conditioner, so that the air in the room is still.

<iframe class="sim" src="/sim/?preset=CovidInAStillRoomCircling&story" frameborder="0"></iframe>

The Probability View shows the buildup of a ring of likely infections as the infectious person circles the room. A quick look at the Concentration shows their circular path, leaving a trail of virus particles behind them.

In this scenario, what do you think happens if we turn on the air conditioner? The next simulation does just this. Start the simulation by pressing {{ layout.play }}

<iframe class="sim" src="/sim/?preset=CovidInARoomCircling&story" frameborder="0"></iframe>

Now, instead of a nice clean ring of likely infections, we immediately see that people on the downwind side of the room are much more likely to be infected - people that had a lower chance of infection in a room with no air recirculation. If we wait a little longer, we can see this effect increasing and even reaching those far upwind of the source of infection, as the recirculating air carries the virus with it. 

Finally, we can look at the Concentration View to see how the airflow is breaking not only the left-right symmetry of the room, but also the up-down symmetry. What do you think would happen if we reverse the direction that the waiter is circling the room? How would the picture change?

# Epilogue
The story of airborne infections is far from over, but our viral Visual Story has reached its end. Using nothing more than your browser and your curiosity, we've explored how airflow might alter the spread of an airborne virus, witnessed the transient and long-term effects that a simple cough can have, and seen the potentially super-spreading effects of a wandering waitor.

As with all of our Stories, it is worth remembering the limitations of what we've learned. Our approach has knowingly ignored lots of factors that could be very important, including the potentially vast differences that can exists between different viruses and between different environments. So, whilst we've hopefully gained lots of intuition, we would do well to take our conclusions with a healthy pinch of salt.

# Looking for more?
Not quite had enough of exploring airborne infections? You can play around with the speed of the air in any of the above simulations by moving the top-most slider that can be found under <span class='click_sequence'>{{ layout.equations }} → **Parameters**</span>, under the label beginning with 'V', to see if and how this impacts the spread of the virus. 

For the science behind this Story, we recommend that you check out the work of [Prof. Ian Griffiths](https://people.maths.ox.ac.uk/griffit4/) and collaborators on modelling the Covid-19 pandemic, which forms a basis for the mathematical models that we've just explored with VisualPDE.

Enjoyed this Visual Story? We'd love to hear your feedback at [hello@visualpde.com](mailto:hello@visualpde.com).

Looking for more VisualPDE? Try out our other [Visual Stories](/visual_stories) or some mathematically flavoured content from [Basic PDEs](/basic-pdes).



