/**
 * Self-tests for the float64 reference solver (numerics/reference_solver.mjs), against
 * closed-form discrete solutions. On each grid below, the chosen mode is an exact eigenvector
 * of the discrete diffusion operator with eigenvalue lambda, so every scheme's solution is
 * known exactly: one-step schemes multiply it by R(dt*lambda/tau) each step, and AB2 follows
 * its two-term recurrence.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createSolver } from "./numerics/reference_solver.mjs";

const amplification = {
  Euler: (z) => 1 + z,
  Mid: (z) => 1 + z + (z * z) / 2,
  RK4: (z) => 1 + z + (z * z) / 2 + z ** 3 / 6 + z ** 4 / 24,
};

// The exact amplitude of the mode after numSteps steps.
function exactAmplitude(scheme, z, numSteps) {
  if (scheme == "AB2") {
    // a_{n+1} = a_n + z(1.5 a_n - 0.5 a_{n-1}), with a_{-1} = a_0 = 1.
    let previous = 1,
      current = 1;
    for (let n = 0; n < numSteps; n++) {
      [previous, current] = [current, current + z * (1.5 * current - 0.5 * previous)];
    }
    return current;
  }
  return amplification[scheme](z) ** numSteps;
}

function bcs(type, value) {
  const bc = { type, value };
  return [{ L: bc, R: bc, T: { type: "periodic" }, B: { type: "periodic" } }];
}

function maxError(solver, exact) {
  let worst = 0;
  solver.u[0].forEach((v, n) => {
    worst = Math.max(worst, Math.abs(v - exact(n)));
  });
  return worst;
}

const schemes = ["Euler", "AB2", "Mid", "RK4"];
const D = 0.7,
  dx = 0.25,
  dt = 0.01,
  tau = 2,
  numSteps = 50,
  nX = 40;

test("reference solver: a periodic Fourier mode decays at each scheme's exact discrete rate", () => {
  const k = 3;
  const lambda = (-4 * D * Math.sin((Math.PI * k) / nX) ** 2) / dx ** 2;
  for (const scheme of schemes) {
    const solver = createSolver({
      nX, nY: 1, Lx: nX * dx, Ly: 1, dx, numSpecies: 1, scheme, dt,
      D: [[() => D]],
      f: [() => 0],
      init: [({ x }) => Math.cos((2 * Math.PI * k * x) / (nX * dx))],
      bcs: bcs("periodic"),
      timescales: [tau],
    });
    solver.step(numSteps);
    const a = exactAmplitude(scheme, (dt * lambda) / tau, numSteps);
    const err = maxError(solver, (n) => a * Math.cos((2 * Math.PI * k * solver.xs[n]) / (nX * dx)));
    assert.ok(err < 1e-12, `${scheme}: ${err}`);
  }
});

test("reference solver: a cosine mode with zero-flux Neumann conditions decays at the exact discrete rate", () => {
  // Ghost reflection about the boundary nodes makes cos(theta*i), theta = pi*k/(nX-1), an
  // eigenvector with eigenvalue -4D sin^2(theta/2)/dx^2.
  const k = 2;
  const theta = (Math.PI * k) / (nX - 1);
  const lambda = (-4 * D * Math.sin(theta / 2) ** 2) / dx ** 2;
  for (const scheme of schemes) {
    const solver = createSolver({
      nX, nY: 1, Lx: nX * dx, Ly: 1, dx, numSpecies: 1, scheme, dt,
      D: [[() => D]],
      f: [() => 0],
      init: [({ x }) => Math.cos(theta * (x / dx - 0.5))],
      bcs: bcs("neumann"),
    });
    solver.step(numSteps);
    const a = exactAmplitude(scheme, dt * lambda, numSteps);
    const err = maxError(solver, (n) => a * Math.cos(theta * n));
    assert.ok(err < 1e-12, `${scheme}: ${err}`);
  }
});

test("reference solver: a sine mode with zero Dirichlet conditions decays at the exact discrete rate", () => {
  // With the boundary nodes fixed at 0, sin(theta*i), theta = pi*k/(nX-1), is an
  // eigenvector of the interior operator.
  const k = 1;
  const theta = (Math.PI * k) / (nX - 1);
  const lambda = (-4 * D * Math.sin(theta / 2) ** 2) / dx ** 2;
  for (const scheme of schemes) {
    const solver = createSolver({
      nX, nY: 1, Lx: nX * dx, Ly: 1, dx, numSpecies: 1, scheme, dt,
      D: [[() => D]],
      f: [() => 0],
      init: [({ x }) => Math.sin(theta * (x / dx - 0.5))],
      bcs: bcs("dirichlet"),
    });
    solver.step(numSteps);
    const a = exactAmplitude(scheme, dt * lambda, numSteps);
    const err = maxError(solver, (n) => a * Math.sin(theta * n));
    assert.ok(err < 1e-12, `${scheme}: ${err}`);
  }
});

test("reference solver: in 2D, a product of periodic modes decays at the summed rate", () => {
  const nY = 16,
    kx = 2,
    ky = 1;
  const lambda =
    (-4 * D * Math.sin((Math.PI * kx) / nX) ** 2) / dx ** 2 -
    (4 * D * Math.sin((Math.PI * ky) / nY) ** 2) / dx ** 2;
  const mode = (x, y) =>
    Math.cos((2 * Math.PI * kx * x) / (nX * dx)) * Math.sin((2 * Math.PI * ky * y) / (nY * dx));
  for (const scheme of schemes) {
    const periodic = { type: "periodic" };
    const solver = createSolver({
      nX, nY, Lx: nX * dx, Ly: nY * dx, dx, numSpecies: 1, scheme, dt,
      D: [[() => D]],
      f: [() => 0],
      init: [({ x, y }) => mode(x, y)],
      bcs: [{ L: periodic, R: periodic, T: periodic, B: periodic }],
    });
    solver.step(numSteps);
    const a = exactAmplitude(scheme, dt * lambda, numSteps);
    const err = maxError(solver, (n) => a * mode(solver.xs[n % nX], solver.ys[Math.floor(n / nX)]));
    assert.ok(err < 1e-12, `${scheme}: ${err}`);
  }
});

test("reference solver: each scheme converges in time at its formal order on a nonlinear, time-dependent problem", () => {
  // du/dt = -u^2 + cos(t), whose solution we approximate with a very fine RK4 run.
  const expectedOrder = { Euler: 1, AB2: 2, Mid: 2, RK4: 4 };
  const T = 1;
  function solve(scheme, dtRun) {
    const solver = createSolver({
      nX: 1, nY: 1, Lx: 1, Ly: 1, dx: 1, numSpecies: 1, scheme, dt: dtRun,
      D: [[null]],
      f: [({ t, u }) => -u[0] * u[0] + Math.cos(t)],
      init: [() => 0.5],
      bcs: bcs("periodic"),
      timescales: [tau],
    });
    solver.step(Math.round(T / dtRun));
    return solver.u[0][0];
  }
  const truth = solve("RK4", 1e-4);
  for (const scheme of schemes) {
    const e1 = Math.abs(solve(scheme, 0.02) - truth);
    const e2 = Math.abs(solve(scheme, 0.01) - truth);
    const order = Math.log2(e1 / e2);
    assert.ok(Math.abs(order - expectedOrder[scheme]) < 0.15, `${scheme}: order ${order}`);
  }
});
