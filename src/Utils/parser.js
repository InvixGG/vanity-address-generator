const yargs = require('yargs/yargs');
const cluster = require("cluster");

const minimumPatternStringLength = 3

/**
 * Parses arguments from command line.
 * @param {Object} args - Command line arguments object.
 * @returns {Object} - Parsed arguments.
 */
const parseArgv = (args) => {
    return yargs(args)
        .usage('Create billions of ERC20 addresses, check if any of them can produce vanity ERC20 contract addresses at given nonce or get you thousands vanity ERC20 addresses, depends on what you want')
        .option('contract', {
            alias: 'c',
            describe: 'Generate contract mode',
            requiresArg: false,
        })
        .option('wallet', {
            alias: 'w',
            describe: 'Generate wallet mode',
            requiresArg: false,
        })
        .option('pattern', {
            alias: 'p',
            describe: 'are patterns to match, accept single or multiple values',
            requiresArg: true,
            string: true,
            array: true,
        })
        .option('nonce', {
            alias: 'n',
            describe: '(for contract mode only) it is nonce you expect. Minimum value is 1 because you must test your wallet by making at least one payout transaction before using to prevent unexpected loss.',
            requiresArg: true,
            number: true,
        })
        .option('exit', {
            alias: 'e',
            describe: 'Exit after X minutes',
            requiresArg: false,
            number: true,
        })
        .version()
        .help('help')
        .argv;
};

/**
 * Parses patterns from command line arguments.
 * @param {Object} argv - Command line arguments object.
 */
const parsePatterns = (argv) => {
    const inputPatterns = argv.pattern;

    if (!inputPatterns) {
        console.error('ERR: No pattern was provided, use flag --pattern to specify');
        return;
    }

    if (typeof inputPatterns == 'boolean') {
        console.error('ERR: Wrong usage of flag --pattern, it requires parameter');
        return;
    }

    const patterns = Array.isArray(inputPatterns) ? inputPatterns : [`${inputPatterns}`];

    if (patterns.length < 1) {
        console.error('ERR: No pattern was provided, use flag --pattern to specify');
        return;
    }

    if (cluster.isPrimary) {
        const re = /^[0-9aA-fF]+$/;
        for (const idx in patterns) {
            const pattern = patterns[idx] = `${patterns[idx]}`.toLowerCase();
            if (pattern.length < minimumPatternStringLength) {
                console.error(`ERR: Pattern '${pattern}' is too short, minimum length is ${minimumPatternStringLength}`);
                return;
            }
            if (!re.test(pattern)) {
                console.error(`ERR: Invalid pattern '${pattern}', only accept combination of 0-9 a-f (hex)`);
                return;
            }
        }
    } else {
        for (const idx in patterns) {
            patterns[idx] = `${patterns[idx]}`.toLowerCase();
        }
    }

    patterns.sort(function(a, b) {
        return b.length - a.length;
    })

    return patterns;
};

/**
 * Parses nonce from command line arguments.
 * @param {Object} argv - Command line arguments object.
 */
const parseNonce = (argv) => {
    const nonce = argv.nonce;

    if (nonce === undefined) {
        console.error('ERR: Missing flag --nonce');
        return;
    }

    if (typeof nonce != 'number') {
        console.error(`ERR: Flag --nonce must be a number (${typeof nonce} found)`);
        return;
    }

    if (Math.floor(nonce) !== nonce) {
        console.error('ERR: Flag --nonce must be an integer');
        console.error('ERR: Minimum nonce is 1 because you must test every generated wallets before use (so nonce 0 will be used for the very first transaction)');
        return;
    }

    return nonce;
};

/**
 * Parses exit flag from command line arguments.
 * @param {Object} argv - Command line arguments object.
 */
const parseExit = (argv) => {
    const exit = argv.exit;
    if (!exit) {
        return;
    }
    if (exit < 0) {
        console.error(`ERR: Value of flag --exit can not be negative`);
        return;
    }
    if (exit === 0) {
        return;
    }
    return exit;
};

module.exports = {
    parseArgv,
    parsePatterns,
    parseNonce,
    parseExit,
};
