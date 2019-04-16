const env = require('./src/util/env');
const log = require('./src/util/log');
const ViolinPlotWorker = require('./src/workers/ViolinPlotWorker').ViolinPlotWorker;
const ViolinPlotBinWorker = require('./src/workers/ViolinPlotBinWorker').ViolinPlotBinWorker;
const GeneListWorker = require('./src/workers/GeneListWorker').GeneListWorker;

const plotWorker = ViolinPlotWorker.getInstance(),
    binWorker = ViolinPlotBinWorker.getInstance(),
    geneWorker = GeneListWorker.getInstance();

plotWorker
    .clearData()
    .parseBarcodeToCellMap(
        env.BARCODE_FILE)
    .then(() => plotWorker.processReadCountTable(
        env.DATASET_NAME,
        env.DATA_FILE,
        env.DST_DIR))
    .then(() => plotWorker.writeLegend(
        env.DATASET_NAME,
        env.DST_DIR))
    .then(() => geneWorker.loadGenes())
    .then(() => geneWorker.putGenes(Object.keys(binWorker.result.genes)))
    .then(() => geneWorker.writeGenes())
    .then(() => plotWorker.logResult())
    .catch((err) => log.info(err));
