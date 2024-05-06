import {generateContinuousText} from "./addressUtils";
import Pattern from "../Models/Pattern";

const minimumLengthToCheckVanityScore = 3;
const maximumLengthToCheckVanityScore = 19;
const continuous: Array<Array<number | Pattern>> = [];
const minimumWow = minimumLengthToCheckVanityScore * 2 + 2;

/**
 * Give vanity score for a pattern.
 * @param {string} pattern - Pattern to check - string of characters.
 * @returns {number} Vanity score - number of characters in the pattern.
 */
function giveBaseVanityScoreToPattern(pattern: string): number {
    const patternLen = pattern.length;
    if (patternLen < 3) {
        return 0;
    }

    if (patternLen <= 5) {
        return patternLen;
    }

    const extraLen = patternLen - 5;
    let vscore = 5;
    for (let i = 0; i < extraLen; i++) {
        vscore += (i + 2);
    }

    return vscore;
}

/**
 * Injects base vanity score to an array of patterns.
 * @param {Pattern[]} arr - Array of patterns.
 */
function injectBaseVanityScore(arr: Pattern[]): Pattern[] {
    const result: Pattern[] = [];
    for (const patternObj of arr) {
        const pattern = patternObj.pattern;
        result.push(new Pattern(pattern, giveBaseVanityScoreToPattern(pattern)));
    }
    return result;
}

/**
 * Initializes vanity score table.
 */
function initVanityScoreTable(): void {
    for (let c = 0; c <= 9; c++) {
        const cL = [];
        for (let i = 0; i < minimumLengthToCheckVanityScore; i++) {
            cL.push(i);
        }

        for (let l = minimumLengthToCheckVanityScore; l <= maximumLengthToCheckVanityScore; l++) {
            const pattern = generateContinuousText(c.toString(), l);
            cL.push(new Pattern(pattern, giveBaseVanityScoreToPattern(pattern)));
        }

        continuous.push(cL);
    }

    const alphabet = ['a', 'b', 'c', 'd', 'e', 'f'];
    for (const letter of alphabet) {
        const cL = [];
        for (let i = 0; i < minimumLengthToCheckVanityScore; i++) {
            cL.push(i);
        }

        for (let l = minimumLengthToCheckVanityScore; l <= maximumLengthToCheckVanityScore; l++) {
            const pattern = generateContinuousText(letter, l);
            cL.push(new Pattern(pattern, giveBaseVanityScoreToPattern(pattern)));
        }

        continuous.push(cL);
    }
}

/**
 * Rates address.
 * @param {string} address - Address to rate.
 * @returns {number} Vanity score - number of characters in the pattern.
 */
function rateAddress(address: string): number {
    return _rateAddress(address, true) + _rateAddress(address, false);
}

/**
 * Rates address.
 * @param {string} address - Address to rate.
 * @param {boolean} prefix - Whether to check prefix or suffix.
 * @returns {number} Vanity score - number of characters in the pattern.
 */
function _rateAddress(address: string, prefix: boolean): number {
    let highestVanityScore = 0;

    for (let c = 15; c >= 0; c--) {
        if (prefix) {
            if (!address.startsWith((continuous[c][minimumLengthToCheckVanityScore] as Pattern).pattern)) {
                continue;
            }
        } else {
            if (!address.endsWith((continuous[c][minimumLengthToCheckVanityScore] as Pattern).pattern)) {
                continue;
            }
        }

        highestVanityScore = (continuous[c][minimumLengthToCheckVanityScore] as Pattern).score;
        for (let l = minimumLengthToCheckVanityScore + 1; l <= maximumLengthToCheckVanityScore; l++) {
            if (prefix) {
                if (address.startsWith((continuous[c][l] as Pattern).pattern)) {
                    highestVanityScore = (continuous[c][l] as Pattern).score;
                } else {
                    return highestVanityScore;
                }
            } else {
                if (address.endsWith((continuous[c][l] as Pattern).pattern)) {
                    highestVanityScore = (continuous[c][l] as Pattern).score;
                } else {
                    return highestVanityScore;
                }
            }
        }
    }

    return highestVanityScore;
}

/**
 * Rates address.
 * @param {string} address - Address to rate.
 * @param {boolean} startsWith - Whether to check prefix or suffix.
 * @param {boolean} endsWith - Whether to check prefix or suffix.
 * @param {number} vscore - Vanity score.
 * @param {string} extraAddress - Address to rate.
 * @param {string} patternMatched - Pattern matched.
 * @returns {number} Vanity score - number of characters in the pattern.
 */
function rateVanityScoreOfAddress(address: string, startsWith: boolean, endsWith: boolean, vscore: number, extraAddress?: string, patternMatched?: string): number {
    let vanityScore = (startsWith ? vscore : 0) + (endsWith ? vscore : 0);
    vanityScore += rateAddress(address);

    if (extraAddress) {
        if (typeof patternMatched === "string") {
            vanityScore += (extraAddress.startsWith(patternMatched) ? vscore : 0) + (extraAddress.endsWith(patternMatched) ? vscore : 0);
        }
        vanityScore += rateAddress(extraAddress);
    }

    return vanityScore;
}

export {
    giveBaseVanityScoreToPattern,
    injectBaseVanityScore,
    initVanityScoreTable,
    rateAddress,
    rateVanityScoreOfAddress,
    minimumWow,
};