import yargs from 'yargs/yargs';
import Pattern from "../Models/Pattern";
import {CommandLineOptions} from "../Interfaces/CommandLineOptions";

/**
 * Parses arguments from the command line.
 * @param {string[]} args - Command line arguments array.
 * @returns Parsed arguments.
 */
async function parseArgv(args: string[]): Promise<CommandLineOptions> {
    return yargs(args)
        .usage('Create billions of ERC20 addresses, check if any of them can produce vanity ERC20 contract addresses at given nonce or get you thousands vanity ERC20 addresses, depends on what you want')
        .option('contract', {
            alias: 'c',
            describe: 'Generate contract mode',
            type: 'boolean',
        })
        .option('wallet', {
            alias: 'w',
            describe: 'Generate wallet mode',
            type: 'boolean',
        })
        .option('pattern', {
            alias: 'p',
            describe: 'Patterns to match, accept single or multiple values',
            type: 'array',
            coerce: (patterns: any[]): string[] => patterns.map(pattern => pattern.toString())
        })
        .option('nonce', {
            alias: 'n',
            describe: 'For contract mode only. Nonce you expect. Minimum value is 1 because you must test your wallet by making at least one payout transaction before using to prevent unexpected loss.',
            type: 'number',
        })
        .option('exit', {
            alias: 'e',
            describe: 'Exit after X minutes',
            type: 'number',
        })
        .help('help')
        .parse();
}

/**
 * Parses patterns from command line arguments.
 * @param {CommandLineOptions} argv - Command line arguments object.
 */
function parsePatterns(argv: CommandLineOptions): Pattern[] | undefined {
    const minimumPatternStringLength = 3;
    const inputPatterns = argv.pattern;

    if (!inputPatterns) {
        console.error('ERR: No pattern was provided, use flag --pattern to specify');
        return;
    }

    const patterns: Pattern[] = [];
    const re = /^[0-9a-f]+$/i; // RegExp for matching hexadecimal characters

    for (const patternStr of inputPatterns) {
        const pattern = patternStr.toLowerCase();
        if (pattern.length < minimumPatternStringLength) {
            console.error(`ERR: Pattern '${pattern}' is too short, minimum length is ${minimumPatternStringLength}`);
            return;
        }

        if (!re.test(pattern)) {
            console.error(`ERR: Invalid pattern '${pattern}', only accept combination of 0-9 a-f (hex)`);
            return;
        }

        patterns.push(new Pattern(pattern, 0));
    }

    patterns.sort((a, b) => b.pattern.length - a.pattern.length);

    return patterns;
}

/**
 * Parses nonce from command line arguments.
 * @param {CommandLineOptions} argv - Command line arguments object.
 */
function parseNonce(argv: CommandLineOptions): number | undefined {
    const nonce = argv.nonce;
    if (nonce === undefined) {
        console.error('ERR: Missing flag --nonce');
        return;
    }

    if (!Number.isInteger(nonce)) {
        console.error('ERR: Flag --nonce must be an integer');
        return;
    }

    return nonce;
}

/**
 * Parses exit flag from command line arguments.
 * @param {CommandLineOptions} argv - Command line arguments object.
 */
function parseExit(argv: CommandLineOptions): number | undefined {
    const exit = argv.exit;
    if (exit === undefined) {
        return;
    }

    if (exit < 0) {
        console.error(`ERR: Value of flag --exit cannot be negative`);
        return;
    }

    return exit;
}

export {
    parseArgv,
    parsePatterns,
    parseNonce,
    parseExit,
};