/**
 * Generate a string of repeated characters based on the selected character and length.
 * Eg: '999999' is the result of generateContinuousText('9', 6).
 * @param char Character to repeat.
 * @param length Length of the result string.
 * @returns Generated string.
 */
function generateContinuousText(char: string, length: number): string {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += char;
    }

    return result;
}

/**
 * Returns the current time in milliseconds.
 * @returns Current time in milliseconds.
 */
function getNowMs(): number {
    return new Date().getTime();
}

export {generateContinuousText, getNowMs};