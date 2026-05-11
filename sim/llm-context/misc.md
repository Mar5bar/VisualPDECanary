# Misc

## Simulator defaults

### Starting a new simulation

Starting a new simulation will start a Grey-Scott simulation with two species, $u$ and $v$.

### Changing the default variable names

When changing "# species" to a higher number previously set, new species will be named by default to `SPECIES2`, `SPECIES3` and `SPECIES4`, for 2, 3, 4 species, respectively.

You are advised to change them to $v$, $w$, $q$ for simplicity, as other parameters are also defined according to them, e.g. $D_{SPECIES2} = D_v$ and so on.

### Default timestepping

By default, VisualPDE uses the Forward Euler method with $\Delta t = 0.1$, this is likely to be too big for many problems. We recommend reducing the timestep and/or changing the method in this case.
