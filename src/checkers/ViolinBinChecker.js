const _ = require('lodash');

const env = require('../util/env');
const log = require('../util/log');
const files = require('../util/files');

class ViolinBinChecker {
    constructor() {
        this.clearData();
    }

    clearData() {
        this.data = {
            plotReads: [],
            binReads: {}
        };

        this.result = {
            rowCt: 0,
            binSum: 0,
            binClusterReadCountSums: {},
            plotClusterReadCountSums: {},
            clusterReadCountCumulativeDiff: 0
        };

        return this;
    }

    static getInstance() {
        if (ViolinBinChecker.instance == null) {
            ViolinBinChecker.instance = new ViolinBinChecker();
        }

        return ViolinBinChecker.instance;
    }

    loadData(violinPlotPath, violinBinPath) {
        log.debug('+++ ViolinBinChecker.loadData');

        const checker = ViolinBinChecker.getInstance(),
            plotHeaderMarker = env.VIOLIN_PLOT_HEADER.split(env.OUT_DELIM)[0],
            binHeaderMarker = env.VIOLIN_BIN_HEADER.split(env.OUT_DELIM)[0];

        return files.streamRead("ViolinBinChecker.loadData, violin plot", violinPlotPath, (line) => {
            const row = line.split(env.OUT_DELIM);

            if (row[0] === plotHeaderMarker) return;
            checker.data.plotReads.push(row);

        }).then(() => {
            return files.streamRead("ViolinBinChecker.loadData, violin bins", violinBinPath, (line) => {
                const row = line.split(env.OUT_DELIM),
                    cluster = row[2];

                if (row[0] === binHeaderMarker) return;
                checker.data.binReads[cluster] = row;
            });
        });
    }

    checkData() {
        log.debug('+++ ViolinBinChecker.checkData');
        const checker = ViolinBinChecker.getInstance();

        // For each plot violin plot point, bump up the row count and add the read count to the plot file's cluster sum.
        // The read count is boosted to a bandwidth-divisible value, to match the bin that should have counted it.
        _.forEach(checker.data.plotReads, (row) => {
            const cluster = files.sanitize(row[2]),
                readCt = parseFloat(files.sanitize(row[3])),
                boostedBandLimitedReadCt = readCt - (readCt % env.VIOLIN_BIN_BANDWIDTH) + env.VIOLIN_BIN_BANDWIDTH;

            if (readCt - boostedBandLimitedReadCt !== 0) {
                log.debug('+++ readCt, boostedBandLimitedReadCt: ' + readCt + ', ' + boostedBandLimitedReadCt);
            }

            checker.result.rowCt++;
            checker.result.plotClusterReadCountSums[cluster] = checker.result.plotClusterReadCountSums[cluster] || 0;
            checker.result.plotClusterReadCountSums[cluster] += boostedBandLimitedReadCt;
        });

        // For each violin bin, add to the bin file's cluster sum.
        Object.keys(checker.data.binReads).map((cluster) => {
            //We take only columns 4 and above, as the first 3 columns are reserved for dataset, gene, and cluster
            const clusterBins = checker.data.binReads[cluster].slice(3);

            _.forEach(clusterBins, (binRawCount, i) => {
                const binCount = parseInt(files.sanitize(binRawCount)),
                    binBandwidth = (i + 1) * env.VIOLIN_BIN_BANDWIDTH;

                checker.result.binSum += binCount;
                checker.result.binClusterReadCountSums[cluster] = checker.result.binClusterReadCountSums[cluster] || 0;
                checker.result.binClusterReadCountSums[cluster] += binCount * binBandwidth;
            });
        });

        //Calculate the cumulative difference between the binned cluster read counts
        _.forEach(Object.keys(checker.result.binClusterReadCountSums), (cluster, i) => {
            const binReadCount = checker.result.binClusterReadCountSums[cluster],
                plotReadCount = checker.result.plotClusterReadCountSums[cluster];

            checker.resultclusterReadCountCumulativeDiff += Math.abs(binReadCount - plotReadCount);
        });
    }

    logResult(filePrefix = '') {
        const checker = ViolinBinChecker.getInstance();
        log.debug('+++ ViolinBinChecker.logResults');
        files.getStreamWriter(env.LOG_DIR + env.PATH_DELIM + filePrefix + env.VIOLIN_BIN_CHECKER_FILE, (os) => {
            os.write(JSON.stringify(checker.result, null, 2));
        });
    }
}

module.exports = {ViolinBinChecker: ViolinBinChecker};
