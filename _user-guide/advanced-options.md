---
layout: page
title: Advanced documentation
lesson_number: 40
thumbnail: /assets/images/Brusselator.PNG
extract: A glossary of all the features you can play with
---

### Share your simulation <a id='copy-url'>
You can share a link to the simulation you have created by clicking
<span class='click_sequence'>{{ layout.settings }} → **Copy URL**</span>
This copies the URL to your clipboard. This includes all the settings, but not the current solution.

You can copy a more verbose description of your simulation in JSON form, especially useful if you're extending VisualPDE with your own examples, by clicking
<span class='click_sequence'>{{ layout.settings }} → **Copy code**</span>

### Brush <a id='brush'>
Paint values onto the canvas by clicking/touching the domain. 

* You can change the **brush shape** by selecting from <span class='click_sequence'>{{ layout.settings }} → **Brush** → **Type**</span>
* Change the **value** that you are painting by selecting <span class='click_sequence'>{{ layout.settings }} → **Brush** → **Value**</span>\
This can be a function of $x$, $y$, $t$, any of the unknowns, and 'RAND', a uniformly random value in $[0,1]$.
* Change the **brush size** by selecting <span class='click_sequence'>{{ layout.settings }} → **Brush** → **Radius**</span>
* Change the **species** ($u$, $v$, $w$) you are painting by selecting from <span class='click_sequence'>{{ layout.settings }} → **Brush** → **Species**</span>
* (Surface plot only) Allow yourself to draw while viewing the solution as a surface using <span class='click_sequence'>{{ layout.settings }} → **Brush** → **3D enabled**</span>

### Domain <a id='domain'>
VisualPDE offers a number of options for customising the domain $\domain$.

* Change the largest side $L$ of the domain in <span class='click_sequence'>{{ layout.settings }} → **Domain** → **Largest side**</span>
* Set the spatial step $\dx=\dy$ used in discretising the domain via  <span class='click_sequence'>{{ layout.settings }} → **Domain** → **Space step**</span>
* Toggle whether or not the domain is forced to be square, independent of the aspect ratio of your device/window, using <span class='click_sequence'>{{ layout.settings }} → **Domain** → **Square**</span>
* Change the domain from 2D to 1D, which removes the $y$ dimension from the simulation, using <span class='click_sequence'>{{ layout.settings }} → **Domain** → **1D**</span>
* Toggle using a custom domain with <span class='click_sequence'>{{ layout.settings }} → **Domain** → **Implicit**</span>\
You can define the domain by setting a boolean (e.g. $x<0.5$) or a simple expression (e.g. $x-0.5$), where (strict) positivity identifies the interior of the domain, in <span class='click_sequence'>{{ layout.settings }} → **Domain** → **Ind. fun**</span>

### Timestepping <a id='timestepping'>
Configure the Forward-Euler timestepping scheme described [here](/_user-guide/solver).

* Set how many timesteps will be performed every time your browser requests a frame from VisualPDE with <span class='click_sequence'>{{ layout.settings }} → **Timestepping** → **Steps/frame**</span>\
This effectively allows you to speed up/slow down the simulation without altering the timestep.
* Change the timestep $\dt$ used in the solver with <span class='click_sequence'>{{ layout.settings }} → **Timestepping** → **Timestep**</span>
* Toggle showing the current simulation time using <span class='click_sequence'>{{ layout.settings }} → **Timestepping** → **Show time**</span>

### Equations <a id='equations'>

### Rendering <a id='rendering'>

### Change how colour is used <a id='colour'>
VisualPDE uses a colour map to visualise the concentration of one species on the canvas.

* To change which species, or function of species, is displayed, type a new function into <span class='click_sequence'>{{ layout.settings }} → **Colour** → **Colour by**</span> 
* Some people prefer different colour maps. You can pick one from our list under <span class='click_sequence'>{{ layout.settings }} → **Colour** → **Colour map**</span> 
* Change the minimum and maximum limit of the colour map by typing values into <span class='click_sequence'>{{ layout.settings }} → **Colour** → **Min value** and **Max value**</span>
You can have VisualPDE pick a range for you based on the current timestep by clicking <span class='click_sequence'>{{ layout.settings }} → **Colour** → **Snap range**</span>To have the range snapped every timestep, toggle <span class='click_sequence'>{{ layout.settings }} → **Colour** → **Auto snap**</span>
* Display the colour bar by toggling <span class='click_sequence'>{{ layout.settings }} → **Colour** → **Colour bar**</span>

### Misc <a id='misc'>
