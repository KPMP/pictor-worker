const ViolinPlotBinWorker = require('../src/workers/ViolinPlotBinWorker').ViolinPlotBinWorker;
const files = require('../src/util/files');
const worker = ViolinPlotBinWorker.getInstance();

const TEST_PATH = "./tests/data";
const TEST_DIRS = ["CCDC115", "NPHS2"];
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
    }).then(() => expect(testResults.rowCt).toBe(testResults.binSum));
};

test('Total number of lines equals sum of all bins, case 1', () => binTotalsTest(TEST_DIRS[0]));
test('Total number of lines equals sum of all bins, case 2', () => binTotalsTest(TEST_DIRS[1]));
