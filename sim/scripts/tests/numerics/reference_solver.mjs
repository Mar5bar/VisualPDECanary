/**
 * A float64 reference implementation of VisualPDE's spatial discretisation and timestepping
 * schemes, used to check the GPU solvers' numerical output.
 *
 * It mirrors the shaders in sim/scripts/RD/simulation_shaders.js: cell-centred nodes, the
 * 5-point flux-form Laplacian with arithmetic-mean face coefficients, ghost-node reflection
 * for Neumann/Robin conditions, prescribed boundary nodes for Dirichlet conditions, and the
 * Euler, AB2, Midpoint and RK4 schemes with per-species timescales. Where the shaders and the
 * intended method of lines differ, this follows the method of lines: Dirichlet nodes take
 * their prescribed value at every stage time, and every term is evaluated at the time of the
 * state it acts on.
 *
 * Problems are described with plain JS functions rather than VisualPDE expression strings,
 * so the reference doesn't depend on the expression parser it's used to check.
 *
 * State layout matches the GPU readback: species s at node (i, j) is u[s][j * nX + i], with
 * j = 0 the bottom row.
 */

/**
 * @typedef {Object} BoundaryCondition
 * @property {"periodic"|"neumann"|"robin"|"dirichlet"|"ghost"} type
 * @property {(p: Point) => number} [value] - The Neumann/Robin flux, Dirichlet value or ghost
 *   value. Neumann and Robin values are outward normal derivatives. Defaults to 0.
 */

/**
 * @typedef {Object} Point - Everything a user-supplied function can depend on.
 * @property {number} x
 * @property {number} y
 * @property {number} t
 * @property {number[]} u - The species values at the point.
 */

/**
 * @typedef {Object} Problem
 * @property {number} nX - Number of nodes in x.
 * @property {number} nY - Number of nodes in y (1 for 1D problems).
 * @property {number} Lx - Domain width; node i sits at x = minX + (i + 0.5) * Lx / nX.
 * @property {number} Ly - Domain height.
 * @property {number} dx - The spatial step used in the finite differences. As in VisualPDE,
 *   this need not equal Lx / nX.
 * @property {number} [dy] - Defaults to dx.
 * @property {number} [minX] - Defaults to 0.
 * @property {number} [minY] - Defaults to 0.
 * @property {number} numSpecies
 * @property {Array<Array<((p: Point) => number) | null>>} D - D[i][j] is the coefficient of
 *   species j's diffusion in species i's equation; null or missing means 0.
 * @property {Array<(p: Point) => number>} f - Reaction terms.
 * @property {Array<(p: Point) => number>} [init] - Initial conditions.
 * @property {Array<ArrayLike<number>>} [initialState] - Initial values at every node, used
 *   instead of init (e.g. to start from exactly the state a GPU solver starts from).
 * @property {Array<{L: BoundaryCondition, R: BoundaryCondition, T: BoundaryCondition, B: BoundaryCondition}>} bcs
 * @property {number[]} [timescales] - Defaults to all 1.
 * @property {"Euler"|"AB2"|"Mid"|"RK4"} scheme
 * @property {number} dt
 */

const SIDES = ["L", "R", "T", "B"];

/**
 * Creates a solver for the given problem.
 * @param {Problem} problem
 */
export function createSolver(problem) {
  const p = {
    dy: problem.dx,
    minX: 0,
    minY: 0,
    timescales: Array(problem.numSpecies).fill(1),
    ...problem,
  };
  const { nX, nY, numSpecies: nS } = p;
  const is2D = nY > 1;
  const N = nX * nY;
  const xs = Array.from({ length: nX }, (_, i) => p.minX + ((i + 0.5) * p.Lx) / nX);
  const ys = Array.from({ length: nY }, (_, j) => p.minY + ((j + 0.5) * p.Ly) / nY);

  // A species is clamped (rather than wrapped) along an axis if any of its conditions on that
  // axis isn't periodic, mirroring setRDEquations().
  const clampX = p.bcs.map((bc) => bc.L.type != "periodic" || bc.R.type != "periodic");
  const clampY = p.bcs.map((bc) => bc.T.type != "periodic" || bc.B.type != "periodic");

  function neighbourIndex(s, i, j, di, dj) {
    let ii = i + di;
    let jj = j + dj;
    ii = clampX[s] ? Math.min(Math.max(ii, 0), nX - 1) : ((ii % nX) + nX) % nX;
    jj = clampY[s] ? Math.min(Math.max(jj, 0), nY - 1) : ((jj % nY) + nY) % nY;
    return jj * nX + ii;
  }

  // In 1D, VisualPDE only applies x boundary conditions (the y ones are skipped when
  // dimension is 1), and the y stencil collapses onto the node itself.
  function activeSides() {
    return is2D ? SIDES : ["L", "R"];
  }

  function isBoundary(side, i, j) {
    switch (side) {
      case "L":
        return i == 0;
      case "R":
        return i == nX - 1;
      case "B":
        return j == 0;
      case "T":
        return j == nY - 1;
    }
  }

  function valueOf(bc, pt) {
    return bc.value ? bc.value(pt) : 0;
  }

  /**
   * Evaluates du/dt (before dividing by the timescales) at every node of state u at time t.
   * Dirichlet nodes are left to the caller.
   */
  function rhs(u, t) {
    const out = Array.from({ length: nS }, () => new Float64Array(N));
    const stencil = { C: [], L: [], R: [], T: [], B: [] };
    for (let j = 0; j < nY; j++) {
      for (let i = 0; i < nX; i++) {
        const k = j * nX + i;
        for (let s = 0; s < nS; s++) {
          stencil.C[s] = u[s][k];
          stencil.L[s] = u[s][neighbourIndex(s, i, j, -1, 0)];
          stencil.R[s] = u[s][neighbourIndex(s, i, j, 1, 0)];
          stencil.T[s] = u[s][neighbourIndex(s, i, j, 0, 1)];
          stencil.B[s] = u[s][neighbourIndex(s, i, j, 0, -1)];
        }
        const x = xs[i];
        const y = ys[j];
        const centre = { x, y, t, u: stencil.C.slice() };

        // Ghost-node boundary conditions overwrite the off-grid neighbour, with flux values
        // evaluated at the boundary node. Neumann is Robin with a given flux.
        for (let s = 0; s < nS; s++) {
          for (const side of activeSides()) {
            const bc = p.bcs[s][side];
            if (!isBoundary(side, i, j)) continue;
            const opposite = { L: "R", R: "L", T: "B", B: "T" }[side];
            const h = side == "L" || side == "R" ? p.dx : p.dy;
            if (bc.type == "neumann" || bc.type == "robin") {
              stencil[side][s] = 2 * h * valueOf(bc, centre) + stencil[opposite][s];
            } else if (bc.type == "ghost") {
              stencil[side][s] = valueOf(bc, centre);
            }
          }
        }

        const at = (dxOff, dyOff, which) => ({
          x: x + dxOff,
          y: y + dyOff,
          t,
          u: stencil[which].slice(),
        });
        const ptL = at(-p.dx, 0, "L");
        const ptR = at(p.dx, 0, "R");
        const ptT = at(0, p.dy, "T");
        const ptB = at(0, -p.dy, "B");
        const bcPt = { x, y, t, u: stencil.C.slice() };

        for (let s = 0; s < nS; s++) {
          let total = p.f[s] ? p.f[s](bcPt) : 0;
          for (let r = 0; r < nS; r++) {
            const Dfun = p.D[s]?.[r];
            if (!Dfun) continue;
            const D = Dfun(bcPt);
            const c = stencil.C[r];
            // 0.5*((D*(uR+uL-2u) + DR*(uR-u) + DL*(uL-u))/dx)/dx, and likewise in y.
            total +=
              (0.5 *
                ((D * (stencil.R[r] + stencil.L[r] - 2 * c) +
                  Dfun(ptR) * (stencil.R[r] - c) +
                  Dfun(ptL) * (stencil.L[r] - c)) /
                  p.dx)) /
              p.dx;
            total +=
              (0.5 *
                ((D * (stencil.T[r] + stencil.B[r] - 2 * c) +
                  Dfun(ptT) * (stencil.T[r] - c) +
                  Dfun(ptB) * (stencil.B[r] - c)) /
                  p.dy)) /
              p.dy;
          }
          out[s][k] = total;
        }
      }
    }
    return out;
  }

  // Overwrites Dirichlet nodes with their prescribed values at time t.
  function applyDirichlet(u, t) {
    for (let s = 0; s < nS; s++) {
      for (const side of activeSides()) {
        const bc = p.bcs[s][side];
        if (bc.type != "dirichlet") continue;
        for (let j = 0; j < nY; j++) {
          for (let i = 0; i < nX; i++) {
            if (!isBoundary(side, i, j)) continue;
            const k = j * nX + i;
            u[s][k] = valueOf(bc, {
              x: xs[i],
              y: ys[j],
              t,
              u: Array.from({ length: nS }, (_, r) => u[r][k]),
            });
          }
        }
      }
    }
    return u;
  }

  // Returns u + c * k / timescales, species by species.
  function axpy(u, c, k) {
    return u.map((us, s) => {
      const out = new Float64Array(N);
      const scale = c / p.timescales[s];
      for (let n = 0; n < N; n++) out[n] = us[n] + scale * k[s][n];
      return out;
    });
  }

  let t = 0;
  let u = Array.from({ length: nS }, (_, s) => {
    if (p.initialState) return Float64Array.from(p.initialState[s]);
    const out = new Float64Array(N);
    for (let j = 0; j < nY; j++) {
      for (let i = 0; i < nX; i++) {
        out[j * nX + i] = p.init[s]({ x: xs[i], y: ys[j], t: 0, u: [] });
      }
    }
    return out;
  });
  u = applyDirichlet(u, 0);
  // AB2 starts from a previous state equal to the initial condition at time -dt, as the GPU
  // solvers do when every history buffer is cleared to the initial condition.
  let previous = { u, t: -p.dt };

  function step() {
    const dt = p.dt;
    let next;
    switch (p.scheme) {
      case "Euler":
        next = axpy(u, dt, rhs(u, t));
        break;
      case "AB2": {
        const now = rhs(u, t);
        const before = rhs(previous.u, previous.t);
        const combined = now.map((ks, s) => ks.map((v, n) => 1.5 * v - 0.5 * before[s][n]));
        next = axpy(u, dt, combined);
        break;
      }
      case "Mid": {
        const k1 = rhs(u, t);
        const half = applyDirichlet(axpy(u, 0.5 * dt, k1), t + 0.5 * dt);
        next = axpy(u, dt, rhs(half, t + 0.5 * dt));
        break;
      }
      case "RK4": {
        const k1 = rhs(u, t);
        const s2 = applyDirichlet(axpy(u, 0.5 * dt, k1), t + 0.5 * dt);
        const k2 = rhs(s2, t + 0.5 * dt);
        const s3 = applyDirichlet(axpy(u, 0.5 * dt, k2), t + 0.5 * dt);
        const k3 = rhs(s3, t + 0.5 * dt);
        const s4 = applyDirichlet(axpy(u, dt, k3), t + dt);
        const k4 = rhs(s4, t + dt);
        const combined = k1.map((ks, s) =>
          ks.map((v, n) => (v + 2 * k2[s][n] + 2 * k3[s][n] + k4[s][n]) / 6),
        );
        next = axpy(u, dt, combined);
        break;
      }
      default:
        throw new Error("Unknown scheme " + p.scheme);
    }
    previous = { u, t };
    t += dt;
    u = applyDirichlet(next, t);
  }

  return {
    step(numSteps = 1) {
      for (let n = 0; n < numSteps; n++) step();
    },
    get t() {
      return t;
    },
    get u() {
      return u;
    },
    xs,
    ys,
  };
}
