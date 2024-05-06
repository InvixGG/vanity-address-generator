import Pattern from "./Pattern";

class Config {
    contractMode: boolean;
    nonce?: number;
    patterns: Pattern[];
    password: string;
    baseDir: string;
    defaultWowVSFilePrefix: string;
    defaultWalletDir: string;
    logFile: string;

    constructor(contractMode: boolean, nonce: number | undefined, patterns: Pattern[], password: string, baseDir: string, defaultWowVSFilePrefix: string, defaultWalletDir: string, logFile: string) {
        this.contractMode = contractMode;
        this.nonce = nonce;
        this.patterns = patterns;
        this.password = password;
        this.baseDir = baseDir;
        this.defaultWowVSFilePrefix = defaultWowVSFilePrefix;
        this.defaultWalletDir = defaultWalletDir;
        this.logFile = logFile;
    }
}

export default Config;