const env = require('./src/util/env');
const log = require('./src/util/log');
const ViolinPlotWorker = require('./src/workers/ViolinPlotWorker').ViolinPlotWorker;
const ViolinBinWorker = require('./src/workers/ViolinBinWorker').ViolinBinWorker;
const GeneListWorker = require('./src/workers/GeneListWorker').GeneListWorker;
const LegendWorker = require('./src/workers/LegendWorker').LegendWorker;

const plotWorker = ViolinPlotWorker.getInstance(),
    binWorker = ViolinBinWorker.getInstance(),
    geneWorker = GeneListWorker.getInstance(),
    legendWorker = LegendWorker.getInstance();

legendWorker.clearData().loadClusterMap()
    .then(() => legendWorker.writeLegend())
    .then(() => plotWorker.clearData().parseBarcodeToCellMap(env.BARCODE_FILE))
    .then(() => plotWorker.processReadCountTable(env.DATASET_NAME, env.DATA_FILE, env.DST_DIR))
    .then(() => geneWorker.loadGenes())
    .then(() => geneWorker.putGenes(Object.keys(binWorker.result.genes)))
    .then(() => geneWorker.writeGenes())
    .then(() => plotWorker.logResult())
    .catch((err) => log.info(err));
