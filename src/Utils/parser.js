const yargs = require('yargs/yargs');
const os = require("os");
const cluster = require("cluster");
const {passwordFileName} = require("./fileUtils");

const minimumPatternStringLength = 3
const numCPUs = os.cpus().length
const suggestedProcessesCount = Math.max(1, numCPUs - 1)

/**
 * Parses arguments from command line.
 * @param {Object} args - Command line arguments object.
 * @returns {Object} - Parsed arguments.
 */
const parseArgv = (args) => {
    return yargs(args)
        .usage('Create billion ERC20 addresses, check if any of them can produce vanity ERC20 contract addresses at given nonce or get you thousands vanity ERC20 addresses, depends on what you want')
        .example(
            "$0 --contract --pattern 88888 99999 --nonce 2 --noPrivateKey",
            "Find wallets can produce vanity ERC20 contract addr starts or ends with 88888 or 99999 at nonce 2"
        )
        .example(
            "$0 --address --pattern 88888 99999 --noPrivateKey",
            "Find wallets with addr starts or ends with 88888 or 99999"
        )
        .example(
            "$0 -c -p c0ffee b00b5 -n 6 -s",
            "Find wallets can produce vanity ERC20 contract addr starts or ends with c0ffee or b00b5 at nonce 6"
        )
        .example(
            "$0 -a -p c0ffee b00b5 -s",
            "Find wallets with addr starts or ends with c0ffee or b00b5"
        )
        .option('contract', {
            alias: 'c',
            describe: 'Generate contract mode',
            requiresArg: false,
        })
        .option('address', {
            alias: 'a',
            describe: 'Generate address mode',
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
            describe: '(for contract mode only) it is nonce you expect. Minimum value is 1 because you must test your wallet by making at least one payout transaction before using to prevent unexpected loss. Can set to 0 if flag `--allowNonce0` also provided',
            requiresArg: true,
            number: true,
        })
        .option('allowNonce0', {
            alias: 'z',
            describe: '(for contract mode only) Allow value of flag `--nonce` can be set to 0',
            requiresArg: false,
        })
        .option('noPrivateKey', {
            alias: 's',
            describe: 'do not write private key to log file (output-?.txt files)',
            requiresArg: false,
        })
        .option('cpu', {
            alias: 'x',
            describe: 'to specify number of children processes (maximum equals to number of CPUs), default = number of CPUs - 1. Machines with above 10 cores, to achieve max performance, should launch multiple processes with single core each (-x=1)',
            requiresArg: true,
            number: true,
        })
        .option('exit', {
            alias: 'e',
            describe: 'Exit after X minutes',
            requiresArg: false,
            number: true,
        })
        .option('debug', {
            alias: 'd',
            describe: `(for debugging purpose only) allow default encryption password 123456 from file ${passwordFileName}`,
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
            console.log(`Pattern '${pattern}' difficulty = ${Math.pow(16, pattern.length)}`);
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
 * Parses number of child processes from command line arguments.
 * @param {Object} argv - Command line arguments object.
 */
const parseChildrenProcessesCount = (argv) => {
    const count = argv.cpu

    if (count === undefined) {
        return {
            count: suggestedProcessesCount,
            max: false,
            single: suggestedProcessesCount === 1,
        };
    }

    if (count < 1 || count > numCPUs) {
        console.error(`ERR: Flag --threads must be a number between 1 and ${numCPUs}`);
        return;
    }

    if (count > suggestedProcessesCount) {
        console.log(`NOTICE: It is recommended to use less than ${numCPUs} children processes on your machine to prevent machine freeze issue`);
    }

    return {
        count: count,
        max: count >= numCPUs,
        single: count === 1,
    };
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
    parseChildrenProcessesCount,
    parseExit,
};
