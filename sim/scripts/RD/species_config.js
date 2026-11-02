/**
 * Shared species/channel index arithmetic for the reaction-diffusion simulator.
 *
 * Simulation state is packed into groups of `CHANNELS_PER_GROUP` texture channels (r,g,b,a).
 * A species' 0-based index (its position in `listOfSpecies`) determines which group it lives
 * in and which channel within that group holds its value.
 * @file
 */

export const CHANNELS_PER_GROUP = 4;

// The most species the UI offers. Raising it also needs the numSpecies/numAlgebraicSpecies
// dropdown ranges in main.js raising.
export const MAX_SPECIES_SUPPORTED = 8;

/**
 * @param {number} numSpecies - Total number of active species.
 * @returns {number} Number of texture groups (each holding up to CHANNELS_PER_GROUP species) needed.
 */
export function numGroups(numSpecies) {
  return Math.ceil(numSpecies / CHANNELS_PER_GROUP);
}

/**
 * @param {number} speciesInd - 0-based index into listOfSpecies.
 * @returns {number} 0-based index of the texture group holding this species.
 */
export function groupOfSpecies(speciesInd) {
  return Math.floor(speciesInd / CHANNELS_PER_GROUP);
}

/**
 * @param {number} speciesInd - 0-based index into listOfSpecies.
 * @returns {number} 0-3 channel index within the species' group.
 */
export function channelOfSpecies(speciesInd) {
  return speciesInd % CHANNELS_PER_GROUP;
}

/**
 * @param {number} speciesInd - 0-based index into listOfSpecies.
 * @returns {string} The rgba channel character ("r","g","b", or "a") within the species' group.
 */
export function channelCharOfSpecies(speciesInd) {
  return "rgba"[channelOfSpecies(speciesInd)];
}

// GLSL reaction-term token name for each species index (0-based). Species 5-8 have no
// natural letter, so they use a numeric suffix on "UFUN".
const REACTION_TOKENS = [
  "UFUN",
  "VFUN",
  "WFUN",
  "QFUN",
  "UFUN5",
  "UFUN6",
  "UFUN7",
  "UFUN8",
];

/**
 * @param {number} speciesInd - 0-based index into listOfSpecies.
 * @returns {string} The GLSL float variable name holding this species' parsed reaction term.
 */
export function reactionTokenOfSpecies(speciesInd) {
  return REACTION_TOKENS[speciesInd];
}

const SPECIES_LETTERS = ["u", "v", "w", "q"];

/**
 * GLSL diffusion-coefficient label for the (i,j) species-index pair (0-based), used to build
 * tokens like "Duu"/"DuuxL" (both indices <4) or "D5_5"/"D1_5xL" (either index >=4, as
 * species 5-8 have no natural letter).
 * @param {number} i - 0-based species index (the diffusing/row species).
 * @param {number} j - 0-based species index (the coefficient's other index/column species).
 * @returns {string} The label to append to "D" (and further to "x"/"y"/"xL" etc suffixes).
 */
export function diffusionLabel(i, j) {
  if (i < 4 && j < 4) return SPECIES_LETTERS[i] + SPECIES_LETTERS[j];
  return (i + 1).toString() + "_" + (j + 1).toString();
}
