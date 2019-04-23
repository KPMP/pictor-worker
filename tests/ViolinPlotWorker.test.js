const ViolinPlotChecker = require('../src/checkers/ViolinPlotChecker').ViolinPlotChecker,
    checker = ViolinPlotChecker.getInstance();

beforeAll(() => {
    return ViolinPlotChecker
        .getInstance()
        .clearData()
        .loadData()
        .then(() => checker.checkData())
        .catch((error) => console.error(error));
});

afterAll(() => {
    checker.logResult();
});

describe('Violin Plot Worker, check against R-generated checks clusters', () => {
    it('Expect no script file singlets', () => expect(checker.result.scriptFileSinglets.length).toBe(0));
    it('Expect no check file singlets', () => expect(checker.result.checkFileSinglets.length).toBe(0));
    it('Expect no script file misclusters', () => expect(checker.result.scriptFileMisclusters.length).toBe(0));
    it('Expect no check file misclusters', () => expect(checker.result.checkFileMisclusters.length).toBe(0));
    it('Expect no script file unmapped barcodes', () => expect(checker.result.scriptFileUnmappedBarcodes.length).toBe(0));
    it('Expect no check file unmapped barcodes', () => expect(checker.result.checkFileUnmappedBarcodes.length).toBe(0));
    it('Expect cumulative difference of clustered read counts between check and script output to be <= 0.1', () =>
        expect(checker.result.cumulativeClusterDiff).toBeLessThanOrEqual(0.1)
    );
});
