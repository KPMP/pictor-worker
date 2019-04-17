const env = require('../src/util/env');
const _ = require('lodash');
const ViolinPlotWorker = require('../src/workers/ViolinPlotWorker').ViolinPlotWorker;
// const ViolinPlotBinWorker = require('../src/workers/ViolinPlotBinWorker').ViolinPlotBinWorker;
const files = require('../src/util/files');
const plotWorker = ViolinPlotWorker.getInstance();

const TEST_PATH = "./tests/data";
const VIOLIN_PLOT_FILE = "SCRNA-SEQ_violinPlot.csv";
const VIOLIN_PLOT_BIN_FILE = "SCRNA-SEQ_violinPlotBins.csv";
const CHECK_PLOT_FILE = "NPHS2_1.txt";

binTotalsTest = (testDir) => {
    let testResults = {
        rowCt: 0,
        binSum: 0,
        bins: []
    },
        violinPath = TEST_PATH + "/" + testDir + "/" + VIOLIN_PLOT_FILE,
        violinBinPath = TEST_PATH + "/" + testDir + "/" + VIOLIN_PLOT_BIN_FILE;

    return files.streamRead("JestViolinPlot", violinPath, (line) => {
        let row = line.split(",");

        if(row[0] === "cellname") {
            return;
        }

        testResults.rowCt++;
    }).then(() => {
        return files.streamRead("JestViolinPlotBins", violinBinPath, (line) => {
            let row = line.split(",");

            if(row[0] === "dataset") {
                return;
            }

            for(let i = 3; i < row.length; i++) {
                testResults.binSum += parseInt(row[i]);
            }
        });
    }).then(() => {
        return expect(testResults.binSum).toBe(testResults.rowCt);
    });
};

checkScriptAgainstRTest = () => {
    let testData = {
            checkFileReads: {},
            scriptFileReads: {},
        },
        testResults = {
            scriptFileSinglets: [],
            checkFileSinglets: [],
            scriptFileMisclusters: [],
            checkFileMisclusters: [],
            scriptFileUnmappedBarcodes: [],
            checkFileUnmappedBarcodes: [],
            clusterDistributions: {},
    };

    return plotWorker.parseBarcodeToCellMap(env.BARCODE_FILE)

        // Get the read counts and cell names from the check file;
        // derive the cluster from the provided cluster map
        .then(() => {
            return files.streamRead("Jest, Read Check NPHS2", TEST_PATH + "/NPHS2/" + CHECK_PLOT_FILE, (line) => {
                const row = line.split("\t");
                if(row[0] === "cellname") {
                    return;
                }

                // Map each barcode to its decoded cluster and read count
                const barcode = files.sanitize(row[0]),
                    cluster = plotWorker.result.barcodeMap[barcode],
                    readCount = files.sanitize(row[1]);

                testData.checkFileReads[barcode] = { barcode, cluster, readCount };

            });
        })

        // Get the read counts, cell names, and clusters from the script-made file
        .then(() => {
            return files.streamRead("Jest, Read Script NPHS2", TEST_PATH + "/NPHS2/" + VIOLIN_PLOT_FILE, (line) => {
                const row = line.split(",");
                if(row[0] === "cellname") {
                    return;
                }

                // Map each barcode to its decoded cluster and read count
                const barcode = files.sanitize(row[0]),
                    cluster = files.sanitize(row[2]),
                    readCount = files.sanitize(row[3]);

                testData.scriptFileReads[barcode] = { barcode, cluster, readCount };

            })
        })

        // Pair matches between the lists into tuples;
        // verify the clusters within tuples match and are correct;
        // log missing (singlet) barcodes from either set
        .then(() => {
            const checkFileKeys = Object.keys(testData.checkFileReads),
                scriptFileKeys = Object.keys(testData.scriptFileReads),
                barcodeMapKeys = Object.keys(plotWorker.result.barcodeMap),
                tuples = scriptFileKeys
                    .filter((row) => checkFileKeys.indexOf(row) > -1)
                    .map((row) => { return {
                        check: testData.checkFileReads[row],
                        script: testData.scriptFileReads[row]
                    }});

            testResults.scriptFileSinglets = scriptFileKeys
                .filter((barcode) => checkFileKeys.indexOf(barcode) === -1);

            testResults.checkFileSinglets = checkFileKeys
                .filter((barcode) => scriptFileKeys.indexOf(barcode) === -1);

            testResults.scriptFileMisclusters = scriptFileKeys
                .filter((barcode, i) => {
                    if(i < 10) console.log('+++ Checking cluster for script barccode ' + barcode);
                    return plotWorker.result.barcodeMap[barcode] !==
                    testData.scriptFileReads[barcode].cluster
                });

            testResults.checkFileMisclusters = checkFileKeys
                .filter((barcode, i) => {
                    if(i < 10) console.log('+++ Checking cluster for check barccode ' + barcode);
                    return plotWorker.result.barcodeMap[barcode] !==
                    testData.checkFileReads[barcode].cluster
                });

            testResults.scriptFileUnmappedBarcodes = scriptFileKeys
                .filter((barcode) => barcodeMapKeys.indexOf(barcode) === -1);

            testResults.checkFileUnmappedBarcodes = checkFileKeys
                .filter((barcode) => barcodeMapKeys.indexOf(barcode) === -1);

            _.forEach(scriptFileKeys,(barcode) => {
                let clusterDist =
                    testResults.clusterDistributions[testData.scriptFileReads[barcode].cluster] ||
                    { "scriptCt": 0, "checkCt": 0, "barcodeMapCt": 0 };

                clusterDist.scriptCt++;
                testResults.clusterDistributions[testData.scriptFileReads[barcode].cluster] = clusterDist;
            });

            _.forEach(checkFileKeys,(barcode) => {
                let clusterDist =
                    testResults.clusterDistributions[testData.checkFileReads[barcode].cluster] ||
                    { "scriptCt": 0, "checkCt": 0, "barcodeMapCt": 0 };

                clusterDist.checkCt++;
                testResults.clusterDistributions[testData.checkFileReads[barcode].cluster] = clusterDist;
            });

            _.forEach(barcodeMapKeys,(barcode) => {
                let clusterDist =
                    testResults.clusterDistributions[plotWorker.result.barcodeMap[barcode]] ||
                    { "scriptCt": 0, "checkCt": 0, "barcodeMapCt": 0 };

                clusterDist.barcodeMapCt++;
                testResults.clusterDistributions[plotWorker.result.barcodeMap[barcode]] = clusterDist;
            });

            // console.log(
            //     '+++ Found ' + tuples.length + ' tuples, ' +
            //     checkFileKeys.length + ' check file barcodes, and ' +
            //     scriptFileKeys.length + ' script file barcodes');
            //
            // console.log(
            //     '+++ Found ' + Object.keys(plotWorker.result.barcodeMap).length +
            //     ' barcodes in barcode map file ' + env.BARCODE_FILE);

            console.log(testResults);
        })

        //Manage expectations
        .then(() => expect(testResults.scriptFileSinglets.length).toBe(0))
        .then(() => expect(testResults.checkFileSinglets.length).toBe(0))
        .then(() => expect(testResults.scriptFileMisclusters.length).toBe(0))
        .then(() => expect(testResults.checkFileMisclusters.length).toBe(0))
        .then(() => expect(testResults.scriptFileUnmappedBarcodes.length).toBe(0))
        .then(() => expect(testResults.checkFileUnmappedBarcodes.length).toBe(0));
};

test('Sum of bins equals number of read counts, case 1: CCDC115', () => binTotalsTest("CCDC115"));
test('Sum of bins equals number of read counts, case 2: NPHS2',   () => binTotalsTest("NPHS2"));
test('R-generated NPHS2 clusters and read counts match script outputs', checkScriptAgainstRTest);