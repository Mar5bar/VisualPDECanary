/**
 * Shared species/channel index arithmetic for the reaction-diffusion simulator.
 *
 * Simulation state is packed into groups of `CHANNELS_PER_GROUP` texture channels (r,g,b,a).
 * A species' 0-based index (its position in `listOfSpecies`) determines which group it lives
 * in and which channel within that group holds its value. This module is the single source
 * of truth for that arithmetic, so a future extension beyond `MAX_SPECIES_SUPPORTED` only
 * needs to bump the constants/UI ranges, not rederive the index math.
 *
 * See /Users/ben/.claude/plans/i-m-planning-a-major-jazzy-zebra.md (Stage 1) for the design
 * this module implements and /Users/ben/.claude/plans/8-species-upgrade-progress.md for
 * per-stage implementation notes.
 * @file
 */

export const CHANNELS_PER_GROUP = 4;

// Current UI ceiling. Bump this (and the numSpecies/numAlgebraicSpecies dropdown ranges in
// main.js, and every other spot flagged "hardcoded ceiling" in the plan's summary table) to
// extend support to 12/16 species in a future upgrade.
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
