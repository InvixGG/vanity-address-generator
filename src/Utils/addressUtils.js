/**
 * Generate something like 999999 based on selected character and length.
 * Eg: 999999 is result of generateContinuousText(9, 6).
 * @param {string} char - Character to use.
 * @param {number} length - Length of the result.
 * @returns {string} - Generated string.
 */
const generateContinuousText = (char, length) => {
    let result = '';
    for (let i = 0; i < length; i++) {
        result = `${result}${char}`;
    }

    return result;
};

/**
 * Returns current time in milliseconds.
 */
const getNowMs = () => {
    return new Date().getTime();
}

module.exports = {
    generateContinuousText,
    getNowMs
};