const _ = require('lodash');

const env = require('../util/env');
const log = require('../util/log');
const files = require('../util/files');
const ViolinPlotWorker = require('../workers/ViolinPlotWorker').ViolinPlotWorker;
const LegendWorker = require('../workers/LegendWorker').LegendWorker;

class ViolinPlotChecker {
    constructor() {
        this.clearData();
    }

    clearData() {
        this.data = {
            barcodeMap: {},
            checkFileReads: {},
            scriptFileReads: {}
        };

        this.result = {
            scriptFileSinglets: [],
            checkFileSinglets: [],
            scriptFileMisclusters: [],
            checkFileMisclusters: [],
            scriptFileUnmappedBarcodes: [],
            checkFileUnmappedBarcodes: [],
            clusterDistributions: {},
            clusterSums: {},
            cumulativeClusterDiff: 0
        };

        return this;
    }

    static getInstance() {
        if (ViolinPlotChecker.instance == null) {
            ViolinPlotChecker.instance = new ViolinPlotChecker();
        }

        return ViolinPlotChecker.instance;
    }

    loadData() {
        const checker = ViolinPlotChecker.getInstance(),
            legendWorker = LegendWorker.getInstance();

        return ViolinPlotWorker.getInstance().parseBarcodeToCellMap(env.BARCODE_FILE)

            // Get the read counts and cell names from the check file;
            // derive the cluster from the provided cluster map
            .then(() => {
                log.debug('+++ ViolinPlotChecker.checkData');
                checker.data.barcodeMap = ViolinPlotWorker.getInstance().result.barcodeMap;

                return files.streamRead("Load Checkfile", env.VIOLIN_PLOT_CHECKER_CHECK_FILE, (line) => {
                    const row = line.split("\t");
                    if (row[0] === "cellname") {
                        return;
                    }

                    // Map each barcode to its decoded cluster and read count
                    const barcode = files.sanitize(row[0]),
                        cluster = checker.data.barcodeMap[barcode],
                        readCount = files.sanitize(row[1]);

                    checker.data.checkFileReads[barcode] = {barcode, cluster, readCount};

                });
            })

            // Get the read counts, cell names, and clusters from the script-made file
            .then(() => {
                return files.streamRead("Load Script Outputs to Check", env.VIOLIN_PLOT_CHECKER_SCRIPT_OUTPUT_FILE, (line) => {
                    const row = line.split(",");
                    if (row[0] === "cellname") {
                        return;
                    }

                    // Map each barcode to its decoded cluster and read count
                    // cellname,gene,cluster,rollup,readcount
                    const barcode = files.sanitize(row[0]),
                        cluster = files.sanitize(row[2]),
                        rollup = files.sanitize(row[3]),
                        readCount = files.sanitize(row[4]),
                        datasetCluster = legendWorker.getDatasetClusterIdFromClusterId(
                            env.VIOLIN_PLOT_CHECKER_CHECK_DATASET, cluster);

                    checker.data.scriptFileReads[barcode] = {barcode, cluster, rollup, datasetCluster, readCount};
                })
            });
    }

    checkData() {
        log.debug('+++ ViolinPlotChecker.checkData');

        // Pair matches between the lists into tuples;
        // verify the clusters within tuples match and are correct;
        // log missing (singlet) barcodes from either set
        const checker = ViolinPlotChecker.getInstance(),
            checkFileKeys = Object.keys(checker.data.checkFileReads),
            scriptFileKeys = Object.keys(checker.data.scriptFileReads),
            barcodeMapKeys = Object.keys(checker.data.barcodeMap);

        checker.result.scriptFileSinglets = scriptFileKeys.filter((barcode) => checkFileKeys.indexOf(barcode) === -1);

        checker.result.checkFileSinglets = checkFileKeys.filter((barcode) => scriptFileKeys.indexOf(barcode) === -1);

        checker.result.scriptFileMisclusters = scriptFileKeys
            .filter((barcode) => checker.data.barcodeMap[barcode] !== checker.data.scriptFileReads[barcode].datasetCluster);

        checker.result.checkFileMisclusters = checkFileKeys
            .filter((barcode) => checker.data.barcodeMap[barcode] !== checker.data.checkFileReads[barcode].cluster);

        checker.result.scriptFileUnmappedBarcodes = scriptFileKeys.filter((barcode) => barcodeMapKeys.indexOf(barcode) === -1);

        checker.result.checkFileUnmappedBarcodes = checkFileKeys.filter((barcode) => barcodeMapKeys.indexOf(barcode) === -1);

        _.forEach(scriptFileKeys, (barcode) => {
            let clusterDist = checker.result.clusterDistributions[checker.data.scriptFileReads[barcode].datasetCluster] ||
                {"scriptCt": 0, "checkCt": 0, "barcodeMapCt": 0},
                clusterSum = checker.result.clusterSums[checker.data.scriptFileReads[barcode].datasetCluster] ||
                    {"scriptSum": 0, "checkSum": 0};

            clusterDist.scriptCt++;
            clusterSum.scriptSum += parseFloat(checker.data.scriptFileReads[barcode].readCount);
            checker.result.clusterDistributions[checker.data.scriptFileReads[barcode].datasetCluster] = clusterDist;
            checker.result.clusterSums[checker.data.scriptFileReads[barcode].datasetCluster] = clusterSum;
        });

        _.forEach(checkFileKeys, (barcode) => {
            let clusterDist = checker.result.clusterDistributions[checker.data.checkFileReads[barcode].cluster] ||
                {"scriptCt": 0, "checkCt": 0, "barcodeMapCt": 0},
                clusterSum = checker.result.clusterSums[checker.data.checkFileReads[barcode].cluster] ||
                    {"scriptSum": 0, "checkSum": 0};

            clusterDist.checkCt++;
            clusterSum.checkSum += parseFloat(checker.data.checkFileReads[barcode].readCount);
            checker.result.clusterDistributions[checker.data.checkFileReads[barcode].cluster] = clusterDist;
            checker.result.clusterSums[checker.data.checkFileReads[barcode].cluster] = clusterSum;
        });

        _.forEach(barcodeMapKeys, (barcode) => {
            let clusterDist =
                checker.result.clusterDistributions[checker.data.barcodeMap[barcode]] ||
                {"scriptCt": 0, "checkCt": 0, "barcodeMapCt": 0};

            clusterDist.barcodeMapCt++;
            checker.result.clusterDistributions[checker.data.barcodeMap[barcode]] = clusterDist;
        });

        _.forEach(Object.keys(checker.result.clusterSums), (clusterId) => {
            checker.result.cumulativeClusterDiff +=
                Math.abs(checker.result.clusterSums[clusterId].scriptSum -
                    checker.result.clusterSums[clusterId].checkSum);
        });
    }

    logResult(filePrefix = '') {
        const checker = ViolinPlotChecker.getInstance();
        log.debug('+++ ViolinPlotChecker.logResults');
        files.getStreamWriter(env.LOG_DIR + env.PATH_DELIM + filePrefix + env.VIOLIN_PLOT_CHECKER_FILE, (os) => {
            os.write(JSON.stringify(checker.result, null, 2));
        });
    }
}

module.exports = {ViolinPlotChecker: ViolinPlotChecker};
