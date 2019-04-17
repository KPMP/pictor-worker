const ViolinBinChecker = require('../src/checkers/ViolinBinChecker').ViolinBinChecker,
    checker = ViolinBinChecker.getInstance();

const TEST_PATH = "./tests/data";
const VIOLIN_PLOT_FILE = "SCRNA-SEQ_violinPlot.csv";
const VIOLIN_PLOT_BIN_FILE = "SCRNA-SEQ_violinPlotBins.csv";

beforeAll(() => {
    return ViolinBinChecker
        .getInstance()
        .clearData()
        .loadData(
            TEST_PATH + "/CCDC115/" + VIOLIN_PLOT_FILE,
            TEST_PATH + "/CCDC115/" + VIOLIN_PLOT_BIN_FILE
        )
        .then(() => checker.checkData());
});

afterAll(() => {
    checker.logResult("CCDC115_");
});

describe('Violin Bin Worker, check CCDC115 bins against plot rows', () => {
    it('Expect row count to equal bin sums', () => expect(checker.result.rowCt).toBe(checker.result.binSum));
    it('Expect cumulative cluster read count difference to be 0', () => expect(checker.result.clusterReadCountCumulativeDiff).toBe(0));
});

// This verifies that tests are being run and working as intended
// describe('Violin Bin Worker, failure checks', () => {
//     it('Expect row count to be higher by 10', () => expect(checker.result.rowCt + 10).toBe(checker.result.binSum));
// });
