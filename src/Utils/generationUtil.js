const randomBytes = require('randombytes');
const { privateToAddress } = require('ethereumjs-util');
const { fromAddressToContractAddressAtGivenNonce, fromPrivateKeyToV3KeyStore } = require("./encryptionUtils");
const { rateVanityScoreOfAddress, minimumWow } = require("./vanityScoreCalculator");
const { appendFile } = require("./fileUtils");

/**
 * Generates new wallet and returns vanity score.
 * @param {Object} cfg - Configuration object.
 * @returns {number} Vanity score - number of characters in the pattern.
 */
const generateNewWalletAndGetVanityScore = (cfg) => {
    const randbytes = randomBytes(32);
    const addressAsBytes = privateToAddress(randbytes);
    if (cfg.contractMode) {
        const contractAddress = fromAddressToContractAddressAtGivenNonce(addressAsBytes, cfg.nonce).toString('hex');

        for (const idx in cfg.patterns) {
            const startsWith = contractAddress.startsWith(cfg.patterns[idx].p);
            const endsWith = contractAddress.endsWith(cfg.patterns[idx].p);

            if (startsWith || endsWith) {
                const address = addressAsBytes.toString('hex');

                let vanityScore = rateVanityScoreOfAddress(contractAddress, startsWith, endsWith, cfg.patterns[idx].s, address, cfg.patterns[idx].p);
                const sVanityScore = vanityScore < 10 ? `0${vanityScore}` : `${vanityScore}`;

                if (vanityScore >= minimumWow) {
                    console.log(`Wow, vanity score ${vanityScore}`);
                    appendFile(`${cfg.baseDir}${cfg.defaultWowVSFilePrefix}-${sVanityScore}.txt`, `\nVanityScore=${sVanityScore}\tContractAddr=0x${contractAddress}\tWalletAddr=0x${address}`);
                }

                const priv = randbytes.toString('hex');
                console.log(`VS=${sVanityScore}.....C=${contractAddress} <= ${address}`);

                appendFile(cfg.logFile, `VanityScore=${sVanityScore}\tNonce=${cfg.nonce}\tContractAddr=0x${contractAddress}\tWalletAddr=0x${address}\tPrivateKey=${priv}`);

                const jsonWalletContent = fromPrivateKeyToV3KeyStore(priv, cfg.password);
                appendFile(`${cfg.defaultWalletDir}/vscore=${sVanityScore}_contract=${contractAddress}_wallet=${address}_nonce=${cfg.nonce}.json`, JSON.stringify(jsonWalletContent));

                return vanityScore;
            }
        }
    } else {
        const address = addressAsBytes.toString('hex');

        for (const idx in cfg.patterns) {
            const startsWith = address.startsWith(cfg.patterns[idx].p);
            const endsWith = address.endsWith(cfg.patterns[idx].p);
            
            if (startsWith || endsWith) {
                let vanityScore = rateVanityScoreOfAddress(address, startsWith, endsWith, cfg.patterns[idx].s);
                const sVanityScore = vanityScore < 10 ? `0${vanityScore}` : `${vanityScore}`;

                if (vanityScore >= minimumWow) {
                    console.log(`Wow, vanity score ${vanityScore}`);
                    appendFile(`${cfg.baseDir}${cfg.defaultWowVSFilePrefix}-${sVanityScore}.txt`, `\nVanityScore=${sVanityScore}\tWalletAddr=0x${address}`);
                }

                const priv = randbytes.toString('hex');
                console.log(`VS=${sVanityScore}.....A=0x${address}`);

                appendFile(cfg.logFile, `VanityScore=${sVanityScore}\tWalletAddr=0x${address}\tPrivateKey=${priv}`);

                const jsonWalletContent = fromPrivateKeyToV3KeyStore(priv, cfg.password);
                appendFile(`${cfg.defaultWalletDir}/vscore=${sVanityScore}_wallet=${address}.json`, JSON.stringify(jsonWalletContent));

                return vanityScore;
            }
        }
    }

    return 0;
};

module.exports = {
    generateNewWalletAndGetVanityScore
};