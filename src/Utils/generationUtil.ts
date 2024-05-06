import randomBytes from 'randombytes';
import {privateToAddress} from 'ethereumjs-util';
import {fromAddressToContractAddressAtGivenNonce, fromPrivateKeyToV3KeyStore} from "./encryptionUtils";
import {rateVanityScoreOfAddress, minimumWow} from "./vanityScoreCalculator";
import {appendFile} from "./fileUtils";
import Config from "../Models/Config";

/**
 * Generates new wallet and returns vanity score.
 * @returns {number} Vanity score - number of characters in the pattern.
 * @param {Config} config - Configuration object.
 */
function generateNewWalletAndGetVanityScore(config: Config): number {
    const randbytes = randomBytes(32);
    const addressAsBytes = privateToAddress(randbytes);
    if (config.contractMode && config.nonce !== undefined) {
        const contractAddress = fromAddressToContractAddressAtGivenNonce(addressAsBytes, config.nonce).toString('hex');

        for (const idx in config.patterns) {
            const startsWith = contractAddress.startsWith(config.patterns[idx].pattern);
            const endsWith = contractAddress.endsWith(config.patterns[idx].pattern);

            if (startsWith || endsWith) {
                const address = addressAsBytes.toString('hex');

                let vanityScore = rateVanityScoreOfAddress(contractAddress, startsWith, endsWith, config.patterns[idx].score, address, config.patterns[idx].pattern);
                const sVanityScore = vanityScore < 10 ? `0${vanityScore}` : `${vanityScore}`;

                if (vanityScore >= minimumWow) {
                    console.log(`Wow, vanity score ${vanityScore}`);
                    appendFile(`${config.baseDir}${config.defaultWowVSFilePrefix}-${sVanityScore}.txt`, `\nVanityScore=${sVanityScore}\tContractAddr=0x${contractAddress}\tWalletAddr=0x${address}`);
                }

                const priv = randbytes.toString('hex');
                console.log(`VS=${sVanityScore}.....C=${contractAddress} <= ${address}`);

                appendFile(config.logFile, `VanityScore=${sVanityScore}\tNonce=${config.nonce}\tContractAddr=0x${contractAddress}\tWalletAddr=0x${address}\tPrivateKey=${priv}`);

                const jsonWalletContent = fromPrivateKeyToV3KeyStore(priv, config.password);
                appendFile(`${config.defaultWalletDir}/vscore=${sVanityScore}_contract=${contractAddress}_wallet=${address}_nonce=${config.nonce}.json`, JSON.stringify(jsonWalletContent));

                return vanityScore;
            }
        }
    } else {
        const address = addressAsBytes.toString('hex');

        for (const idx in config.patterns) {
            const startsWith = address.startsWith(config.patterns[idx].pattern);
            const endsWith = address.endsWith(config.patterns[idx].pattern);

            if (startsWith || endsWith) {
                let vanityScore = rateVanityScoreOfAddress(address, startsWith, endsWith, config.patterns[idx].score);
                const sVanityScore = vanityScore < 10 ? `0${vanityScore}` : `${vanityScore}`;

                if (vanityScore >= minimumWow) {
                    console.log(`Wow, vanity score ${vanityScore}`);
                    appendFile(`${config.baseDir}${config.defaultWowVSFilePrefix}-${sVanityScore}.txt`, `\nVanityScore=${sVanityScore}\tWalletAddr=0x${address}`);
                }

                const priv = randbytes.toString('hex');
                console.log(`VS=${sVanityScore}.....A=0x${address}`);

                appendFile(config.logFile, `VanityScore=${sVanityScore}\tWalletAddr=0x${address}\tPrivateKey=${priv}`);

                const jsonWalletContent = fromPrivateKeyToV3KeyStore(priv, config.password);
                appendFile(`${config.defaultWalletDir}/vscore=${sVanityScore}_wallet=${address}.json`, JSON.stringify(jsonWalletContent));

                return vanityScore;
            }
        }
    }

    return 0;
}

export {generateNewWalletAndGetVanityScore};