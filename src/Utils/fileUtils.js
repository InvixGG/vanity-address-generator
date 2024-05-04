const fs = require('fs');
const cluster = require("cluster");

const passwordFileName = 'chiefplug-encryption-password.txt';

/**
 * Appends content to a file.
 * @param {string} logFile - File to append content to.
 * @param {string} logContent - Content to append.
 */
const appendFile = (logFile, logContent) => {
    try {
        fs.writeFileSync(logFile, '\n' + logContent, { flag: 'a+' });
    } catch (err) {
        console.error(err);
        console.error(`ERR: Failed to append content: '${logContent}'`);
        console.error(` into file '${logFile}'`);
    }
};

/**
 * Reads password from a file.
 * @param {boolean} isDebug - Whether to return debug password or not.
 * @returns {string | undefined} Password - Password read from a file.
 */
const readPassword = (isDebug = false) => {
    if (!fs.existsSync(passwordFileName)) {
        try {
            fs.writeFileSync(passwordFileName, '123456', { flag: 'a+' });
        } catch (err) {
            console.error(err);
            console.error(`ERR: Unable to create default ${passwordFileName} file`);
            console.error(`ERR: You may need to check permission, or manually create a file with name ${passwordFileName}, open it with a text editor and write your password you want to encrypt wallet info`);
            return;
        }
    }

    const password = fs.readFileSync(passwordFileName, 'utf8').toString().trim();
    if (password === '123456') {
        if (isDebug === true) {
            return password;
        }

        console.error(`ERR: You have to open ${passwordFileName} file and replace the default password 123456 with yours strongly secured password. This password will be used to create json wallet files (V3 keystore)`);
        return;
    } else {
        const minimumPasswordLength = 6;
        if (password.length < minimumPasswordLength) {
            console.error(`ERR: Password is too short, require minimum ${minimumPasswordLength} characters in length`);
            return
        }

        if (cluster.isPrimary) {
            console.log(`WARNING: remember to wipe content of ${passwordFileName} file after you done. It's dangerous to leave your secure password there`);
        }

        return password;
    }
};

/**
 * Creates a directory.
 * @param {string} dir - Directory to create.
 */
const createDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
};

module.exports = {
    passwordFileName,
    appendFile,
    readPassword,
    createDir,
};