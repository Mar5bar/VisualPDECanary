---
layout: page
title: Advanced documentation
lesson_number: 40
thumbnail: /assets/images/Brusselator.PNG
extract: A glossary of all the features you can play with
---

The basic functionality of every option that can be found in the menus of VisualPDE, accessible via {{ layout.equations }} and {{ layout.settings }}.

### Definitions <a id='definitions'>
**Typeset**\
Check this box to have VisualPDE typeset the specified equations, making use of all the defined diffusion coefficients, functions and parameters. Terms will not be substituted in if they are constants that are not 0 or 1.

$D_u$, $D_v$, $D_w$, ...\
Set the diffusion coefficients of all the species in the simulation. When **Cross diffusion** is enabled, you can also set interaction terms, which are written $D_{uv}$ etc. These can be functions of space ($x$, $y$), time ($t$), any of the unknowns ($u$, $v$, $w$, $q$), the size of the domain ($L$, $L_x$, $L_y$), the images ($S$, $T$) and any quantities defined in **Parameters**. See our discussion of [valid expressions](#valid-expressions) for valid syntax and a list of available in-built functions.

$f$, $g$, $h$, ...\
Define the inhomogeneities in the equations. These can be functions of space ($x$, $y$), time ($t$), any of the unknowns ($u$, $v$, $w$, $q$), the size of the domain ($L$, $L_x$, $L_y$), the images ($S$, $T$) and any quantities defined in **Parameters**. See our discussion of [valid expressions](#valid-expressions) for valid syntax and a list of available in-built functions.

### Parameters <a id='parameters'>
This menu contains a list of all the user-specified values that can be used throughout VisualPDE. New parameters can be defined using the empty input field at the bottom of the list of parameters. Parameters must be specified as numerical values and cannot depend on other quantities (including each other).

**Basics**\
The basic syntax for defining a parameter is

```
name = value
```

which will make the quantity 'name' available to the simulation. You can then freely change 'value', which will instantly propagate throughout VisualPDE. If you try to use a name that clashes with an internal variable (some of which are only found under the hood of VisualPDE), a warning will appear to inform you of this. Parameters can be removed by deleting the text that defines them. You can even choose a 'name' that includes subscripts, such as 'k_1u'. This will be interpreted as $k_{1u}$ automatically by VisualPDE.

**Sliders**\
The more advanced syntax 

```
name = value in [start,step,stop]
```

creates a slider for your variable, ranging between the 'start' and 'stop' values in increments of 'step'. The 'step' parameter can be omitted and VisualPDE will choose a step automatically. For example,

```
a = 0.5 in [0,1]
```

creates a slider that ranges between 0 and 1, with initial value 0.5 and an automatically determined step size.

The configuration of a slider (value, start, step, stop) can be updated by modifying the relevant parts of the expression that defines it. Sliders can be removed by deleting 'in ...' from the parameter definition, and will be removed automatically when the associated parameter is removed.

### Boundary conditions <a id='boundary-conditions'>
Boundary conditions can be specified for any species in the simulation. The following boundary conditions are available:

* Periodic
* [Dirichlet](https://en.wikipedia.org/wiki/Dirichlet_boundary_condition) (e.g. $u\onboundary = 0$)
* [Neumann](https://en.wikipedia.org/wiki/Neumann_boundary_condition) (e.g. $\pd{u}{n}\onboundary = 0$)
* [Robin](https://en.wikipedia.org/wiki/Robin_boundary_condition) (e.g. $(u + \pd{u}{n})\onboundary = 0$)

Boundary conditions that allow you to specify values can be functions of space ($x$, $y$), time ($t$), any of the unknowns ($u$, $v$, $w$, $q$), the size of the domain ($L$, $L_x$, $L_y$), the images ($S$, $T$) and any quantities defined in **Parameters**. Robin boundary conditions are the only type supported that allow you to use an unknown in the specification of its own boundary condition. See our discussion of [valid expressions](#valid-expressions) for valid syntax and a list of available in-built functions.

### Initial conditions <a id='initial-conditions'>
Initial conditions can be specified for any species in the simulation. They can be functions of space ($x$, $y$), the size of the domain ($L$, $L_x$, $L_y$), the images ($S$, $T$) and any quantities defined in **Parameters**. See our discussion of [valid expressions](#valid-expressions) for valid syntax and a list of available in-built functions.


### Brush <a id='brush'>
**Type**\
Change the shape of the brush, choosing between **Disk**, **Horizontal line** and **Vertical line**.

**Value**\
Change the **value** that you are painting. This can be a function of space ($x$, $y$), time ($t$), any of the unknowns ($u$, $v$, $w$, $q$), the size of the domain ($L$, $L_x$, $L_y$), the images ($S$, $T$) and 'RAND', a uniformly random value in $[0,1]$.

**Radius**\
Change the brush size, measured on the same scale as the domain size. This can even be a function of space ($x$, $y$), time ($t$), any of the unknowns ($u$, $v$, $w$, $q$), the size of the domain ($L$, $L_x$, $L_y$) and the images ($S$, $T$).

**Species**\
Set the **species** ($u$, $v$, $w$, $q$) you are painting.

**3D enabled**\
Allow yourself to draw while viewing the solution as a surface (surface plot only).

### Domain <a id='domain'>
**Largest side**\
Change the largest side $L$ of the domain. Must be a numerical value.

**Space step**\
Set the spatial step $\dx=\dy$ used in discretising the domain. You may have to decrease the timestep $\dt$ in order to maintain numerical stability if you decrease the spatial step (as discussed [here](/user-guide/solver#timestepping)). Must be a numerical value.

**Square**\
Toggle whether or not the domain is forced to be square, independent of the aspect ratio of your device/window.

**1D**\
Change the domain from 2D to 1D, which removes the $y$ dimension from the simulation. Make sure that any boundary conditions don't include a $y$ after moving to 1D.

**Implicit**\
Toggle the use of a custom domain $\domain$ that is determined implicitly from a user-set expression.

**Ind. fun (indicator function)**\
Define the domain implicitly by setting a boolean (e.g. $x<0.5$) or a simple expression (e.g. $x-0.5$), where (strict) positivity identifies the interior of the domain. This can be a function of space ($x$, $y$), time ($t$), any of the unknowns ($u$, $v$, $w$, $q$), the size of the domain ($L$, $L_x$, $L_y$) and the images ($S$, $T$).

### Timestepping <a id='timestepping'>
**Steps/frame**\
Set how many timesteps will be performed every time your browser requests a frame from VisualPDE. This setting effectively allows you to speed up/slow down the simulation without altering the timestep, though large values may cause some stuttering on some devices. Must be a numerical value.

**Timestep**\
Set the timestep $\dt$ used in the solver. You may have to increase the spatial step $\dx$ in order to maintain numerical stability if you increase the timestep (as discussed [here](/user-guide/solver)). Must be a numerical value.

**Show time**\
Show/hide the current simulation time in the simulation window.

### Equations <a id='equations'>
**No. species**\
Specify the number of unknowns (1, 2, 3, or 4) in the simulatino.

**Cross (diffusion)**\
Enable cross diffusion in systems with 2 or more species, enabling simulation of a wide range of systems.

**Algebraic**\
Convert the specified equations to algebraic form in systems with cross diffusion enabled.

### Rendering <a id='rendering'>
**Expression**\
Choose the expression that you want to be used to colour the domain, which can be any function of the species solved for, as well as space, time, and user-defined parameters. Often, this is either $u$, $v$, $w$ or $q$. Alternatively, setting this to 'MAX' will colour the domain by the maximum of the species. Explicitly, this can be a function of space ($x$, $y$), time ($t$), any of the unknowns ($u$, $v$, $w$, $q$), the size of the domain ($L$, $L_x$, $L_y$) and the images ($S$, $T$).

**Resolution**\
Set the resolution at which your browser renders the simulation. This only impacts on displaying the solution and is completely independent of the spatial discretisation. In surface plots, increase the resolution to render the surface more smoothly. Must be a natural number.

**Plot type**\
Choose from three types of plot: **line**, **plane** or **surface**. Any simulation can be viewed as any plot type, though line plots are best suited to 1D simulations. Surface plots are constructed by using the chosen **Expression** as a height map, the limits of the colour axis and the **Max height** parameter. The limits of the colour axis specify the values at which the height of the surface is capped.

**Max height**\
The maximum height of a plotted surface, measured in the same units as the domain size. Changing this parameter effectively makes the surface variation more/less prominent. Must be a numerical value.

**View $\theta$/$\phi$**\
[Euler angles](https://en.wikipedia.org/wiki/Euler_angles) specifying the current 3D viewpoint, with $\theta\in[0,\pi]$ and $\phi\in[0,2\pi]$. As Euler angles [don't do a perfect job](https://en.wikipedia.org/wiki/Gimbal_lock) of describing orientations, you may find that a viewpoint loaded in from a URL isn't quite what you expected, but only if you were looking at the surface from far behind and underneath the default view. You can manipulate these values either by inputting new values, or see them update as you rotate the viewpoint with your pointer (click and drag).

**Zoom**\
The current zoom level of the 3D view. You can manipulate the value directly or, on touch devices, by 'pinching to zoom'.

**Man. smooth (manual smoothing)**\
Use this option to force the use of manual, configurable, unoptimised filtering in place of device-default interplation of displayed colours. This toggle is not available on devices that do not support smoothing by default; in this case, manual smoothing is always enabled.

**Smoothing scale**\
Control the degree of smoothing applied to the simulation output before display. Setting this value to zero turns off all smoothing. Larger values demand more memory and compute power, but increasingly smooth the output with bilinear interpolation. Only available if manual smoothing is enabled.

### Colour <a id='colour'>
**Colour map**\
Set the current colour map being used to convert **Expression** into a colour value. Use the dropdown to select from the available options. We have tried to cater for everyone in these options but, if you find that no colour map is available that allows you to easily distinguish between values, please let us know at [hello@visualpde.com](mailto:hello@visualpde.com) so that we can add a more appropriate map.

**Min/Max value**\
Set the limits of the colourmap that transforms  **Expression** into colour. If viewing a surface plot, this also impacts the height of the surface. Must be a numerical value.

**Snap range**\
Click to instantly snap **Min value** and **Max value** to the current minimum and maximum of **Expression** in the domain. If these values are within a small tolerance (0.005), VisualPDE will center the range on the average of the two and fix a width of 0.005.

**Auto snap**\
Toggle the automatic snapping of the colourmap limits. This can be very useful if you don't know the range in which **Expression** will fall, especially if it is changing frequently.

**Colour bar**\
Toggle the display of the current colour bar and limits.

**Background**\
Set the background colour of the simulation window, which you will see often when using **Surface Plot** or **Implicit**. In implicit domains, the exterior of the domain adopts this colour.

### Images <a id='images'>
**$S(x,y)$, $T(x,y)$**\
Define the scalar fields $S(x,y)$ and $T(x,y)$, which are derived from images that you can upload by clicking on the current image. Via the symbols 'S' and 'T' throughout VisualPDE, you can access the average RGB value of each image at each point in space, effectively treating them as greyscale. Advanced users can access the individual RGBA channels via 'SR', 'SG', etc. VisualPDE will stretch images so that they cover the domain edge-to-edge. Note that this does not respect **Implicit**. The defaults draw from images of [Sofya Kovalevskaya](https://en.wikipedia.org/wiki/Sofya_Kovalevskaya) and [Alan Turing](https://en.wikipedia.org/wiki/Alan_Turing).

### Misc <a id='misc'>
**Integrate**\
Display the integral of **Expression** over the domain. This integral is coarsely approximated by a simple Riemann sum, with accuracy improving with mesh refinement. This can be used to track the numerical evolution of quantities that should be conserved in a system.

**Fix random**\
Fix the seed of the (pseudo)random number generator used to assign values to 'RAND' in all free-text fields in the VisualPDE interface. Note that 'RAND' always varies in space.

**Copy code**\
Copy a verbose description of your simulation in JSON form, which is especially useful if you're extending VisualPDE with your own examples.

**Preset**\
Select a preset from a long list of examples included in VisualPDE. This list is a subset of all the examples and will likely only be useful if you are wanting to quickly switch between many different examples.

**Debug**\
Select from a frequently updated list of available debugging tools. A permanent fixture is **Copy debug info**, which copies a selection of configuration information to your clipboard (handy when reporting bugs).

### Writing valid expressions <a id='valid-expressions'>
**Standard syntax**\
VisualPDE aims to support standard mathematical syntax (+,-,*,/), along with the carat notation '^' for exponentiation. Parentheses '()' are also supported for bracketing terms together, and must be used when calling any special functions. In general, whitespace around binary operators will be ignored, so that '2 * 2' is valid syntax for multiplication, for example. Quantities with subscripts, such as $L_x$ and $L_y$, are written with an underscore, e.g. 'L_x' and 'L_y'.

Examples of valid syntax include

```
sin(x) * cos(y)
exp( -(x-L_x)^2 / 10)
1 + (x^2 + x + 1) / (y^2 + y + 1)
```

**Special functions**\
Throughout VisualPDE, you can make use of the special functions 'sin', 'cos', 'tan', 'exp', 'log', 'sqrt', 'sinh', 'cosh', 'tanh' and 'H', where the latter is a [Heaviside function](https://en.wikipedia.org/wiki/Heaviside_step_function) smoothed over the interval $[-1,1]$ (see the [GLSL reference](https://registry.khronos.org/OpenGL-Refpages/gl4/html/smoothstep.xhtml) for details). All function arguments should be surrounded by parentheses, e.g. 'sin(x)'.