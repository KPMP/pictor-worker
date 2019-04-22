const env = require('../src/util/env');
const ViolinBinChecker = require('../src/checkers/ViolinBinChecker').ViolinBinChecker,
    checker = ViolinBinChecker.getInstance();

const BASE_DIR = env.VIOLIN_BIN_CHECKER_BASE_DIR + "/C/CCDC115/";
const VIOLIN_PLOT_FILE = env.DATASET_NAME + "_" + env.VIOLIN_PLOT_FILENAME + ".csv";
const VIOLIN_PLOT_BIN_FILE = env.DATASET_NAME + "_" + env.VIOLIN_BIN_FILENAME + ".csv";

beforeAll(() => {
    return ViolinBinChecker
        .getInstance()
        .clearData()
        .loadData(
            BASE_DIR + VIOLIN_PLOT_FILE,
            BASE_DIR + VIOLIN_PLOT_BIN_FILE
        )
        .then(() => checker.checkData())
        .catch((err) => {
            console.error(err);
            console.log('+++ Tried loading plot file: ' + BASE_DIR + VIOLIN_PLOT_FILE);
            console.log('+++ Tried loading bin file: ' + BASE_DIR + VIOLIN_BIN_FILE);
        });;
});

afterAll(() => {
    checker.logResult("CCDC115_");
});

describe('Violin Bin Worker, check CCDC115 bins against plot rows', () => {
    it('Expect row count to equal bin sums', () => expect(checker.result.rowCt).toBe(checker.result.binSum));
    it('Expect cumulative cluster read count difference to be 0', () => expect(checker.result.clusterReadCountCumulativeDiff).toBe(0));
});
