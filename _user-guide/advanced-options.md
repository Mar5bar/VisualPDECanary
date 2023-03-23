---
layout: page
title: Advanced documentation
lesson_number: 40
thumbnail: /assets/images/Brusselator.PNG
extract: A glossary of all the features you can play with
---

The basic functionality of every option that can be found in {{ layout.settings }}

### Share your simulation <a id='copy-url'>
**Copy URL**\
Share a link to the simulation you have created. This copies the URL to your clipboard and includes all the settings, but not the current solution.

**Copy code**\
Copy a more verbose description of your simulation in JSON form, which is especially useful if you're extending VisualPDE with your own examples.

### Brush <a id='brush'>
**Type**\
Change the shape of the brush, choosing between **Circle**, **Horizontal line**, and **Vertical line**.

**Value**\
Change the **value** that you are painting. This can be a function of $x$, $y$, $t$, any of the unknowns, and 'RAND', a uniformly random value in $[0,1]$.

**Radius**\
Change the brush size, relative to the configured domain size.

**Species**\
Set the **species** ($u$, $v$, $w$) you are painting.

**3D enabled**\
Allow yourself to draw while viewing the solution as a surface (surface plot only).

### Domain <a id='domain'>
**Largest side**\
Change the largest side $L$ of the domain.

**Space step**\
Set the spatial step $\dx=\dy$ used in discretising the domain. You may have to decrease the timestep $\dt$ in order to maintain numerical stability if you decrease the spatial step (as discussed [here](/user-guide/solver)).

**Square**\
Toggle whether or not the domain is forced to be square, independent of the aspect ratio of your device/window.

**1D**\
Change the domain from 2D to 1D, which removes the $y$ dimension from the simulation. Make sure that any boundary conditions don't include a $y$ after moving to 1D.

**Implicit**\
Toggle the use of a custom domain $\domain$ that is determined implicitly from a user-set expression.

**Ind. fun (indicator function)**\
Define the domain implicitly by setting a boolean (e.g. $x<0.5$) or a simple expression (e.g. $x-0.5$), where (strict) positivity identifies the interior of the domain.

### Timestepping <a id='timestepping'>
**Steps/frame**\
Set how many timesteps will be performed every time your browser requests a frame from VisualPDE. This setting effectively allows you to speed up/slow down the simulation without altering the timestep, though large values may cause some stuttering on some devices.

**Timestep**\
Set the timestep $\dt$ used in the solver. You may have to increase the spatial step $\dx$ in order to maintain numerical stability if you increase the timestep (as discussed [here](/user-guide/solver)).

**Show time**\
Show/hide the current simulation time in the simulation window.

### Equations <a id='equations'>
**No. species**\
Specify the number of unknowns (1, 2, or 3) in the system.

**Cross (diffusion)**\
Enable cross diffusion in systems with 2 or more species.

**Algebraic**\
Convert the final equation to be algebraic in systems with cross diffusion enabled.

### Rendering <a id='rendering'>
**Expression**\
Choose the expression that you want to be used to colour the domain, which can be any function of the species solved for, as well as space, time, and user-defined parameters. Often, this is either $u$, $v$, or $w$.

**Resolution**\
Set the resolution at which your browser renders the simulation. This only impacts on displaying the solution and is completely independent of the spatial discretisation. In surface plots, increase the resolution to render the surface more smoothly.

**Line plot**\
Click to configure the camera to show you a quasi-line plot, which enforces a 1D domain. In practice, this is a surface plot viewed almost from the side. In the default view, you may find it difficult to paint onto the domain (requires a 3D-enabled brush) – rotating the viewpoint can rectify this at the expense of a line-like appearance.

**Surface plot**\
Plot the solution as a surface. The height is determined by the chosen **Expression**, the limits of the colour axis, and the **Max height** parameter. The limits of the colour axis specify the values at which the height of the surface is capped.

**Max height**\
The maximum height of a plotted surface, relative to the size $L$ of the domain. Changing this parameter effectively makes the surface variation more/less prominent.

**View $\theta$/$\phi$**\
[Euler angles](https://en.wikipedia.org/wiki/Euler_angles) specifying the current 3D viewpoint, with $\theta\in[0,\pi]$ and $\phi\in[0,2\pi]$. As Euler angles [don't do a perfect job](https://en.wikipedia.org/wiki/Gimbal_lock) of describing orientations, you may find that a viewpoint loaded in from a URL isn't quite what you expected, but only if you were looking at the surface from far behind and underneath the default view. You can manipulate these values either by inputting new values, or see them update as you rotate the viewpoint with your pointer (click and drag).

**Zoom**\
The current zoom level of the 3D view. You can manipulate the value directly or, on touch devices, by 'pinching to zoom'.

### Colour <a id='colour'>
**Colour map**\
Set the current colour map being used to convert **Expression** into a colour value. Use the dropdown to select from the available options. We have tried to cater for everyone in these options but, if you find that no colour map is available that allows you to easily distinguish between values, please let us know at [hello@visualpde.com](mailto:hello@visualpde.com) so that we can add a more appropriate map.

**Min/Max value**\
Set the limits of the colourmap that transforms  **Expression** into colour. If viewing a surface plot, this also impacts the height of the surface.

**Snap range**\
Click to instantly snap **Min value** and **Max value** to the current minimum and maximum of **Expression** in the domain. If these values are within a small tolerance (0.005), VisualPDE will center the range on the average of the two and fix a width of 0.005.

**Auto snap**\
Toggle the automatic snapping of the colourmap limits. This can be very useful if you don't know the range in which **Expression** will fall, especially if it is changing frequently.

**Colour bar**\
Toggle the display of the current colour bar and limits.

**Background**\
Set the background colour of the simulation window, which you will see often when using **Surface Plot** or **Implicit**.

### Misc <a id='misc'>
**Initial $u$,$v$,$w$**\
Specify the values to which the unknowns are initialised when resetting the simulation. These expressions can be functions of $x$, $y$, the special string 'RAND' that assigns a random number in [0,1] to each point in the domain, along with any user-defined parameters.

**Preset**\
Select a preset from a long list of examples included in VisualPDE. This list is a subset of all the examples and will likely only be useful if you are wanting to quickly switch between many different examples.

**Fix random**\
Fix the seed of the (pseudo)random number generator used to assign values to 'RAND' in all free-text fields in the VisualPDE interface. Note that 'RAND' is always heterogeneous in space.

**$T(x,y)$**\
Define the scalar field $T(x,y)$, which is derived from an image that you can upload. The spatially varying field averages the RGB values of the image at each point in space, effectively treating it as greyscale, and maps it onto $\domain$ by stretching it edge-to-edge. Note that this does not respect **Implicit**. The default draws from an image of [Alan Turing](https://en.wikipedia.org/wiki/Alan_Turing).
