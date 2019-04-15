const env = require('./src/util/env');
const log = require('./src/util/log');
const PictorWorker = require('./src/workers/PictorWorker').PictorWorker;

const HELP_MSG = `
ERROR: Missing required arguments or .env configuration.
Configure them in .env or pass them at runtime in order.  Passed arguments will override any .env arguments.
---
1: DATASET_NAME - Dataset name to prefix to dataset files and legend file
2: DST_DIR - Root folder to receive gene subfolders and dataset legend file
3: BARCODE_FILE - Map of cell barcodes to site-specific cell cluster IDs
4: DATA_FILE - Input data table, mapping genes as rows, barcodes as columns, and read counts as cells

Example:
node index.js "LMD" "./public/data/dst" "./public/data/barcodes.txt" "./public/data/table.txt" "\\t" ","
`;

const worker = PictorWorker.getInstance();
let datasetNameInput = env.DATASET_NAME,
    dstOutputPath = env.DST_DIR,
    barcodeToCellMapInputPath = env.BARCODE_FILE,
    readCountTableInputPath = env.DATA_FILE;

process.argv.forEach(function (val, i) {
    switch(i) {
        case 2:
            datasetNameInput = val;
            break;

        case 3:
            dstOutputPath = val;
            break;

        case 4:
            barcodeToCellMapInputPath = val;
            break;

        case 5:
            readCountTableInputPath = val;
            break;

        default:
            break;
    }
});

if (!datasetNameInput ||
    !dstOutputPath ||
    !barcodeToCellMapInputPath ||
    !readCountTableInputPath) {
    log.info(HELP_MSG);
    process.exit(1);
}

worker
    .clearData()
    .parseBarcodeToCellMap(
        barcodeToCellMapInputPath)
    .then(() => worker.processReadCountTable(
        datasetNameInput,
        readCountTableInputPath,
        dstOutputPath))
    .then(() => worker.writeLegend(
        datasetNameInput,
        dstOutputPath))
    .then(() => worker.logResult())
    .catch((err) => {
        log.info(err);
        process.exit(2);
    });
