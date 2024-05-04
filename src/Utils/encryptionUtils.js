const Web3 = require('web3');
const util = require("ethereumjs-util");
const rlp = require("rlp");

const web3 = new Web3('https://non-exists-host.non-exists-tld');

/**
 * Encrypts private key with given password.
 * @param {string} privateKeyAsHex - Private key in hex format.
 * @param {string} password - Password to encrypt private key.
 */
const fromPrivateKeyToV3KeyStore = (privateKeyAsHex, password) => {
    return web3.eth.accounts.encrypt(`0x${privateKeyAsHex}`, password);
};

/**
 * Converts address to contract address at given nonce.
 * @param {Buffer} bufferAddress - Address in buffer format.
 * @param {number} nonce - Nonce to use.
 */
const fromAddressToContractAddressAtGivenNonce = (bufferAddress, nonce) => {
    return util.keccak256(util.arrToBufArr(rlp.encode([bufferAddress, nonce]))).slice(12);
};

module.exports = {
    fromPrivateKeyToV3KeyStore,
    fromAddressToContractAddressAtGivenNonce,
};