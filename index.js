const env = require('./src/util/env');
const log = require('./src/util/log');
const ViolinPlotWorker = require('./src/workers/ViolinPlotWorker').ViolinPlotWorker;

const worker = ViolinPlotWorker.getInstance();

worker
    .clearData()
    .parseBarcodeToCellMap(
        env.BARCODE_FILE)
    .then(() => worker.processReadCountTable(
        env.DATASET_NAME,
        env.DATA_FILE,
        env.DST_DIR))
    .then(() => worker.writeLegend(
        env.DATASET_NAME,
        env.DST_DIR))
    .then(() => worker.logResult())
    .catch((err) => {
        log.info(err);
        process.exit(2);
    });
