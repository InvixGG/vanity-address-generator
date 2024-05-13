import Web3 from 'web3';
import {Buffer} from 'buffer';
import {arrToBufArr, keccak256} from 'ethereumjs-util';
import rlp from 'rlp';
import {V3Keystore} from "../Interfaces/V3Keystore";

const web3 = new Web3('https://non-exists-host.non-exists-tld');

/**
 * Encrypts a private key with the given password.
 * @param privateKeyAsHex Private key in hex format.
 * @param password Password to encrypt the private key.
 * @returns Encrypted private key.
 */
function fromPrivateKeyToV3KeyStore(privateKeyAsHex: string, password: string): V3Keystore {
    return web3.eth.accounts.encrypt(`0x${privateKeyAsHex}`, password)
}

/**
 * Converts an address to a contract address at the given nonce.
 * @param bufferAddress Address in buffer format.
 * @param nonce Nonce to use.
 * @returns Contract address.
 */
function fromAddressToContractAddressAtGivenNonce(bufferAddress: Buffer, nonce: number): Buffer {
    return keccak256(arrToBufArr(rlp.encode([bufferAddress, nonce]))).slice(12);
}

export {fromPrivateKeyToV3KeyStore, fromAddressToContractAddressAtGivenNonce};