const randomBytes = require('randombytes')
const { privateToAddress } = require('ethereumjs-util')
const cluster = require('cluster')
const process = require('process')
const { parseArgv, parseNonce, parsePatterns, parseChildrenProcessesCount, parseExit } = require("./Utils/parser");
const { createDir, readPassword, appendFile } = require("./Utils/fileUtils");
const { initVanityScoreTable, injectBaseVanityScore } = require("./Utils/vanityScoreCalculator");
const { generateNewWalletAndGetVanityScore } = require("./Utils/generationUtil");
const { getNowMs } = require("./Utils/addressUtils");

/**
 * Main function of the app.
 */
const main = function() {
    const argv = parseArgv(process.argv.slice(2));

    const baseDir = 'chiefplug-generator/';
    const baseWalletsDir = `${baseDir}wallets/`;
    const addrWalletsDir = `${baseWalletsDir}addr/`;
    const contractWalletsDir = `${baseWalletsDir}contract/`;

    try {
        // create required directories
        createDir(baseDir);
        createDir(baseWalletsDir);
        createDir(addrWalletsDir);
        createDir(contractWalletsDir);
    } catch (e) {
        console.error(e);
        console.error('ERR: Failed to creates required directories!!!');
        console.error(`\t${baseDir}`);
        console.error(`\t${baseWalletsDir}`);
        console.error(`\t${addrWalletsDir}`);
        console.error(`\t${contractWalletsDir}`);
        console.error(' Is it permission issue?');
        return;
    }

    const contractMode = argv.contract !== undefined;
    const addressMode = argv.address !== undefined;

    if (!contractMode && !addressMode) {
        console.error('ERR: You must specify either flag `--contract` or `--address`');
        return;
    } else if (contractMode && addressMode) {
        console.error('ERR: You can only specify one of too flag `--contract` or `--address`');
        return;
    }

    const defaultWalletDir = contractMode ? contractWalletsDir : addrWalletsDir;
    const defaultLogFilePrefix = contractMode ? 'output-contract' : 'output-addr';
    const defaultWowVSFilePrefix = contractMode ? 'vscore-contract' : 'vscore-addr';

    const isDebug = argv.debug === true;

    const nonce = contractMode ? parseNonce(argv) : undefined;
    if (contractMode) {
        if (nonce === undefined) {
            return;
        }

        if (argv.allowNonce0 === true) {
            if (nonce < 0) {
                console.error('ERR: Value of flag --nonce must be >= 0');
                return;
            }
        } else {
            if (nonce < 1) {
                console.error('ERR: Value of flag --nonce must be >= 1');
                console.error(' Minimum nonce is 1 because you must test every generated wallets before use (so nonce 0 will be used for the very first transaction)');
                return;
            }
        }

        if (cluster.isPrimary && nonce > 10) {
            console.log(`WARNING: Selected nonce ${nonce} is too high. Nonce is number of transaction an address have sent before. This app generates new addresses so if nonce is too high which means you have to make a lot transactions to fill the gap`);
        }
    }

    const patterns = parsePatterns(argv);

    if (!patterns) {
        return;
    }

    if (contractMode) {
        if (cluster.isPrimary) {
            if (patterns.length === 1) {
                console.log(`Searching for ERC20 addresses which can create contract with prefix or suffix '${patterns[0]}' at nonce ${nonce} (0x${nonce.toString(16)})`);
            } else {
                console.log('Searching for ERC20 addresses which can create contract with prefix or suffix in list');
                console.log(`[${patterns.join(', ')}]`);
                console.log(`at nonce ${nonce} (0x${nonce.toString(16)})`);
            }
        }
    } else {
        if (cluster.isPrimary) {
            if (patterns.length === 1) {
                console.log(`Searching for ERC20 addresses with prefix or suffix '${patterns[0]}'`);
            } else {
                console.log('Searching for ERC20 addresses with prefix or suffix in list');
                console.log(`[${patterns.join(', ')}]`);
            }
        }
    }

    const inputThreadsInfo = cluster.isPrimary ? parseChildrenProcessesCount(argv) : undefined;
    const numberOfChildren = inputThreadsInfo ? inputThreadsInfo.count : undefined;
    const isMaximumCpuUsed = inputThreadsInfo ? inputThreadsInfo.max: undefined;
    const isSingleCpuMode = inputThreadsInfo ? inputThreadsInfo.single : undefined;
    if (cluster.isPrimary) {
        if (!numberOfChildren) {
            return;
        }
    }

    const password = readPassword(isDebug);
    if (!password) {
        return;
    }

    const doNotSavePrivateKeyToLog = argv.noPrivateKey === true;

    if (cluster.isPrimary) {
        console.log(`Generated ERC20 addresses will be written into file '${baseDir}${defaultLogFilePrefix}-?.txt' and json wallet files will be written into '${defaultWalletDir}' directory`);
    }

    initVanityScoreTable();

    if (cluster.isPrimary) {
        if (doNotSavePrivateKeyToLog) {
            console.log('You have selected to not to save raw private key into log file');
        } else {
            console.log('WARNING: This app will save private key of generated addresses into log file, to disable this feature, use --noPrivateKey option');
        }
        console.log('WARNING: You HAVE TO test every generated wallets before using them to prevent un-expected loss. Firstly test import using json wallet file, secondly test transfer funds on Test Nets');
    }

    cfg.contractMode = contractMode;
    cfg.nonce = nonce;
    cfg.patterns = patterns;
    cfg.password = password;
    cfg.doNotSavePrivateKeyToLog = doNotSavePrivateKeyToLog;
    cfg.baseDir = baseDir;
    cfg.defaultWowVSFilePrefix = defaultWowVSFilePrefix;
    cfg.defaultWalletDir = defaultWalletDir;

    let highestVanityScore = 0;

    const startMs = getNowMs();

    const inputExit = parseExit(argv);
    const exitAtMs = inputExit === undefined ? undefined : startMs + inputExit * 60 * 1000;
    if (exitAtMs && cluster.isPrimary) {
        console.log(`Application will exits after ${inputExit} minutes`);
    }

    if (cluster.isPrimary && isSingleCpuMode) {
        let lastReport = startMs; // first report is 5s after started
        const pid = privateToAddress(randomBytes(32)).toString('hex').substring(0, 6);
        const reportInterval = 20000; // 20s
        const logFile = `${baseDir}${defaultLogFilePrefix}-${pid}.txt`;
        let generated = 0; // total number of addresses generated by this process
        let found = 0; // total number of addresses generated by this process and match requirement
        let reportCounter = 0;
        appendFile(logFile, 'App starts'); // Test log to make sure process has permission to write file

        console.log(`Single process ${pid} has started`);

        injectBaseVanityScore(patterns);

        console.log(`NOTICE: It's safe to remove the password file at this point if you are running single process`);
        if (process.platform !== "win32") {
            console.log(` TIPS: Recommended way to remove a file with sensitive data is running command: rm -P <file_name>`);
            console.log(`  since it will rewrite content of file with some pseudo content before permanent delete it`);
        }

        cfg.logFile = logFile;

        for (;;) {
            const score = generateNewWalletAndGetVanityScore(cfg);
            generated++;

            if (score > 0) {
                found++;

                if (score > highestVanityScore) {
                    highestVanityScore = score;
                }
            }

            if (++reportCounter > 250000) {
                reportCounter = 0;
                const nowMs = getNowMs();
                if (nowMs - lastReport < reportInterval) {
                    continue;
                }
                lastReport = nowMs;
                const timePassed = Math.floor((nowMs - startMs) / 1000);

                console.log(`${timePassed} seconds passed, generated ${generated} addresses, avg ${(found / timePassed).toFixed(3)} found addr/s from ${Math.floor(generated / timePassed)} created addr/s. Highest vanity score = ${highestVanityScore}`);

                if (exitAtMs && exitAtMs < nowMs) {
                    console.log('Application is exiting due to flag `--exit`!');
                    process.exit(0);
                }
            }
        }
    } else if (cluster.isPrimary) {
        const cache = [];
        console.log(`Launching ${numberOfChildren} children processes`);

        for (let i = 0; i < numberOfChildren; i++) {
            const cacheData = {
                generated: 0,
                found: 0,
            };
            cache.push(cacheData);
            const proc = cluster.fork({
                pidChild: i + 1,
                childrenCount: numberOfChildren,
                report: isMaximumCpuUsed,
            });
            if (!isMaximumCpuUsed) {
                proc.on('message', function(msg) {
                    if (msg.pidChild) {
                        cacheData.generated = msg.generated
                        cacheData.found = msg.found
                        highestVanityScore = Math.max(highestVanityScore, msg.highestVanityScore)
                    }
                });
            }
        }

        if (isMaximumCpuUsed) {
            console.log('Due to all CPUs are used for computing so each child process will report by it\'s self');
        } else {
            const interval = setInterval(function() {
                const nowMs = getNowMs()
                const timePassed = Math.floor((nowMs - startMs) / 1000)

                let sumGenerated = 0;
                let sumFound = 0;
                for (const idx in cache) {
                    sumGenerated += cache[idx].generated;
                    sumFound += cache[idx].found;
                }
                console.log(`${timePassed} seconds passed, generated ${sumGenerated} addresses, avg ${(sumFound / timePassed).toFixed(3)} found addr/s from ${Math.floor(sumGenerated / timePassed)} created addr/s. Highest vanity score = ${highestVanityScore}`);

                if (exitAtMs && exitAtMs < nowMs) {
                    console.log('Application is exiting due to flag `--exit`!');
                    clearInterval(interval);
                    process.exit(0);
                }
            }, 20000);
        }
    } else {
        let lastReportChild = startMs; // first report is 5s after started
        const childEnv = process.env;
        const pidChild = childEnv.pidChild;
        const selfReport = childEnv.report === true || childEnv.report === 'true';
        const reportIntervalChild = selfReport ? 20000: 10000;
        const logFileChild = `${baseDir}${defaultLogFilePrefix}-${pidChild}.txt`;
        let generatedOnChild = 0; // total number of addresses generated by this process
        let foundOnChild = 0; // total number of addresses generated by this process and match requirement
        let reportCounterOnChild = 0;
        appendFile(logFileChild, 'App starts'); // Test log to make sure process has permission to write file

        console.log(`Child process ${pidChild} has started`);

        injectBaseVanityScore(patterns);

        if (childEnv.childrenCount === pidChild) {
            console.log(`NOTICE: It's safe to remove the password file at this point`);
            if (process.platform !== "win32") {
                console.log(` TIPS: Recommended way to remove a file with sensitive data is running command: rm -P <file_name>`);
                console.log(`  since it will rewrite content of file with some pseudo content before permanent delete it`);
            }
        }

        cfg.logFile = logFileChild;

        for (;;) {
            const score = generateNewWalletAndGetVanityScore(cfg);
            generatedOnChild++;

            if (score > 0) {
                foundOnChild++;

                if (score > highestVanityScore) {
                    highestVanityScore = score;
                }
            }

            if (++reportCounterOnChild > 250000) {
                reportCounterOnChild = 0;
                const nowMs = getNowMs();

                if (nowMs - lastReportChild < reportIntervalChild) {
                    continue;
                }

                lastReportChild = nowMs;
                const timePassed = Math.floor((nowMs - startMs) / 1000);

                if (selfReport) {
                    console.log(`(Child ${pidChild}) avg ${(foundOnChild / timePassed).toFixed(3)} found addr/s from ${Math.floor(generatedOnChild / timePassed)} created addr/s`);
                } else {
                    process.send({
                        pidChild: pidChild,
                        generated: generatedOnChild,
                        found: foundOnChild,
                        highestVanityScore: highestVanityScore,
                    });
                }

                if (exitAtMs && exitAtMs < nowMs) {
                    console.log('Application is exiting due to flag `--exit`!');
                    process.exit(0);
                }
            }
        }
    }
}

const cfg = {

};

module.exports = main;