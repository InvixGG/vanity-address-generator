const { generateContinuousText } = require("./addressUtils");

const minimumLengthToCheckVanityScore = 3;
const maximumLengthToCheckVanityScore = 19;
const continuous = [];
const minimumWow = minimumLengthToCheckVanityScore * 2 + 2;

/**
 * Give vanity score for an address.
 * @param {string} pattern - Pattern to check - string of characters.
 * @returns {number} Vanity score - number of characters in the pattern.
 */
const giveBaseVanityScoreToPattern = (pattern) => {
    if (typeof pattern !== 'string')
        throw `Pattern must be string`;

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
};

/**
 * Injects base vanity score to an array of patterns.
 * @param {Array} arr - Array of patterns - array of objects with p (pattern) and s (score) properties.
 */
const injectBaseVanityScore = (arr) => {
    for (const idx in arr) {
        const pattern = arr[idx];
        arr[idx] = {
            p: pattern,
            s: giveBaseVanityScoreToPattern(pattern),
        };
    }
};

/**
 * Initializes vanity score table.
 */
const initVanityScoreTable = () => {
    for (let c = 0; c <= 9; c++) {
        const cL = [];
        for (let i = 0; i < minimumLengthToCheckVanityScore; i++) {
            cL.push(i);
        }

        for (let l = minimumLengthToCheckVanityScore; l <= maximumLengthToCheckVanityScore; l++) {
            const pattern = generateContinuousText(c.toString(), l);
            cL.push({
                p: pattern,
                s: giveBaseVanityScoreToPattern(pattern),
            });
        }

        continuous.push(cL);
    }

    const alphabet = ['a', 'b', 'c', 'd', 'e', 'f'];
    for (const idx in alphabet) {
        const cL = [];
        for (let i = 0; i < minimumLengthToCheckVanityScore; i++) {
            cL.push(i);
        }

        for (let l = minimumLengthToCheckVanityScore; l <= maximumLengthToCheckVanityScore; l++) {
            const pattern = generateContinuousText(alphabet[idx], l);
            cL.push({
                p: pattern,
                s: giveBaseVanityScoreToPattern(pattern),
            });
        }

        continuous.push(cL);
    }
};

/**
 * Rates address.
 * @param {string} address - Address to rate.
 * @returns {number} Vanity score - number of characters in the pattern.
 */
const rateAddress = (address) => {
    return _rateAddress(address, true) + _rateAddress(address, false);
};

/**
 * Rates address
 * @param {string} address - Address to rate.
 * @param {boolean} prefix - Whether to check prefix or suffix.
 * @returns {number} Vanity score - number of characters in the pattern.
 */
const _rateAddress = (address, prefix) => {
    let highestVanityScore = 0;

    for (let c = 15 /* 9 -> 0 */ /* a -> f */; c >= 0; c--) {
        if (prefix) {
            if (!address.startsWith(continuous[c][minimumLengthToCheckVanityScore].p)) {
                continue;
            }
        } else {
            if (!address.endsWith(continuous[c][minimumLengthToCheckVanityScore].p)) {
                continue;
            }
        }

        highestVanityScore = continuous[c][minimumLengthToCheckVanityScore].s;
        for (let l = minimumLengthToCheckVanityScore + 1; l <= maximumLengthToCheckVanityScore; l++) {
            if (prefix) {
                if (address.startsWith(continuous[c][l].p)) {
                    highestVanityScore = continuous[c][l].s;
                } else {
                    return highestVanityScore;
                }
            } else {
                if (address.endsWith(continuous[c][l].p)) {
                    highestVanityScore = continuous[c][l].s;
                } else {
                    return highestVanityScore;
                }
            }
        }
    }

    return highestVanityScore;
}

/**
 * Rates address of an address.
 * @param {string} address - Address to rate.
 * @param {boolean} startsWith - Whether to check prefix or suffix.
 * @param {boolean} endsWith - Whether to check prefix or suffix.
 * @param {number} vscore - Vanity score.
 * @param {string} extraAddress - Address to rate.
 * @param {string} patternMatched - Pattern matched.
 * @returns {number} Vanity score - number of characters in the pattern.
 */
const rateVanityScoreOfAddress = (address, startsWith, endsWith, vscore, extraAddress, patternMatched) => {
    let vanityScore = (startsWith ? vscore : 0) + (endsWith ? vscore : 0);
    vanityScore += rateAddress(address);

    if (extraAddress) {
        vanityScore += (extraAddress.startsWith(patternMatched) ? vscore : 0) + (extraAddress.endsWith(patternMatched) ? vscore : 0);
        vanityScore += rateAddress(extraAddress);
    }

    return vanityScore;
};

module.exports = {
    giveBaseVanityScoreToPattern,
    injectBaseVanityScore,
    initVanityScoreTable,
    rateAddress,
    rateVanityScoreOfAddress,
    minimumWow,
};