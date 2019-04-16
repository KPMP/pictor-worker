const ViolinPlotBinWorker = require('../src/workers/ViolinPlotBinWorker').ViolinPlotBinWorker;
const files = require('../src/util/files');
const worker = ViolinPlotBinWorker.getInstance();

const TEST_PATH = "./tests/data";
const VIOLIN_PLOT_FILE = "SCRNA-SEQ_violinPlot.csv";
const VIOLIN_PLOT_BIN_FILE = "SCRNA-SEQ_violinPlotBins.csv";

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
    }).then(() => expect(testResults.binSum).toBe(testResults.rowCt));
};

test('Sum of bins equals number of read counts, case 1: CCDC115', () => binTotalsTest("CCDC115"));
test('Sum of bins equals number of read counts, case 2: NPHS2',   () => binTotalsTest("NPHS2"));
