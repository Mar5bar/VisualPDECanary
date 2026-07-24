# Misc

## Simulator defaults

### Starting a new simulation

Starting a new simulation will start a Grey-Scott simulation with two species, $u$ and $v$.

### Changing the default variable names

When changing "# species" to a higher number than the species names previously provided cover, any additional species will be named by default to `VARIABLE2`, `VARIABLE3`, ..., `VARIABLE8` (whichever position they fall in), regardless of how many species there are in total.

You are advised to change them to $v$, $w$, $q$ (for up to 4 species) for simplicity, as other parameters are also defined according to them, e.g. $D_{VARIABLE2} = D_v$ and so on. Species beyond the fourth have no natural single-letter name; a common convention is `u5` through `u8`, though any valid name works.

### Default timestepping

By default, VisualPDE uses the Forward Euler method with $\Delta t = 0.1$, this is likely to be too big for many problems. We recommend reducing the timestep and/or changing the method in this case.
