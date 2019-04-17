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
            TEST_PATH + "/NPHS2/" + VIOLIN_PLOT_FILE,
            TEST_PATH + "/NPHS2/" + VIOLIN_PLOT_BIN_FILE
        )
        .then(() => checker.checkData());
});

afterAll(() => {
    checker.logResult("NPHS2_");
});

describe('Violin Bin Worker, check NPHS2 bins against plot rows', () => {
    it('Expect row count to equal bin sums', () => expect(checker.result.rowCt).toBe(checker.result.binSum));
    it('Expect cumulative cluster read count difference to be 0', () => expect(checker.result.clusterReadCountCumulativeDiff).toBe(0));
});
