const PictorWorker = require('./src/PictorWorker').PictorWorker;

const HELP_MSG = `
ERROR: Missing required arguments.  Are you passing all of these in order?
---
1: datasetNameInput - Dataset name to prefix to dataset files and legend file
2: dstOutputPath - Root folder to receive gene subfolders and dataset legend file
3: barcodeToCellMapInputPath - Map of cell barcodes to site-specific cell cluster IDs
4: readCountTableInputPath - Input data table, mapping genes as rows, barcodes as columns, and read counts as cells
5: delimiterInput - Optional input delimiter character; defaults to tab
6: delimiterOutput - Optional output delimiter character; defaults to comma

Output files are all generated with .csv extension.

Example:
node index.js "LMD" "./public/data/dst" "./public/data/barcodes.txt" "./public/data/table.txt" "\\t" ","

`;

let worker = PictorWorker.getInstance();
let datasetNameInput = null,
    dstOutputPath = null,
    barcodeToCellMapInputPath = null,
    readCountTableInputPath = null,
    delimiterInput = "\t",
    delimiterOutput = ",";

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

        case 6:
            delimiterInput = val;
            break;

        case 7:
            delimiterOutput = val;
            break;

        default:
            break;
    }
});

if (!datasetNameInput ||
    !dstOutputPath ||
    !barcodeToCellMapInputPath ||
    !readCountTableInputPath ||
    !delimiterInput ||
    !delimiterOutput) {

    console.log(HELP_MSG);
    process.exit(1);
}

worker
    .clearData()
    .parseBarcodeToCellMap(barcodeToCellMapInputPath, delimiterInput)
    .then(worker.processReadCountTable(
        datasetNameInput,
        readCountTableInputPath,
        delimiterInput,
        dstOutputPath,
        delimiterOutput))
    .then(worker.writeLegend(
        datasetNameInput,
        dstOutputPath,
        delimiterOutput))
    .then(worker.logResults());
