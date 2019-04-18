const cla = require('command-line-args');

const optDefs = [
    {name: 'mungeConfig', alias: 'm', type: String},
    {name: 'help', alias: 'h', type: Boolean}
];

const options = cla(optDefs);

const HELP_MSG = `
This script parses transcriptomic read count tables and cell barcodes into servable CSVs.
The parameters are stored in a .env file. Copy .env.example to .env and update it accordingly.
You may also specify a .env file.

WARNING: If no .env is found, defaults will be used silently as defined in src/util/env.js.

Example:
node index.js                                   # Uses default .env in same directory
node index.js --mungeConfig=./some/other/.env   # Use a custom .env file
node index.js -m=./some/other.env               # Same as above
`;

if(options.hasOwnProperty('help')) {
    console.log(HELP_MSG);
    process.exit(0);
}

require('dotenv').config({ path: options.hasOwnProperty('mungeConfig') ? options.mungeConfig : '.env' });

module.exports.PATH_DELIM = process.env.PATH_DELIM || "/";
module.exports.ROW_DELIM = process.env.ROW_DELIM || "\n";
module.exports.OUT_DELIM = process.env.OUT_DELIM || ",";
module.exports.IN_DELIM = process.env.IN_DELIM || "\t";
module.exports.VIOLIN_PLOT_FILENAME = process.env.VIOLIN_PLOT_FILENAME || "violinPlot";
module.exports.VIOLIN_PLOT_HEADER = process.env.VIOLIN_PLOT_HEADER || "cellname,gene,cluster,readcount";
module.exports.DATASET_NAME = process.env.DATASET_NAME || undefined;
module.exports.DST_DIR = process.env.DST_DIR || undefined;
module.exports.BARCODE_FILE = process.env.BARCODE_FILE || undefined;
module.exports.DATA_FILE = process.env.DATA_FILE || undefined;
module.exports.VIOLIN_BIN_FILENAME = process.env.VIOLIN_BIN_FILENAME || "violinPlotBins";
module.exports.VIOLIN_BIN_HEADER = process.env.VIOLIN_BIN_HEADER || "cluster,";
module.exports.VIOLIN_BIN_BANDWIDTH = parseFloat(process.env.VIOLIN_BIN_BANDWIDTH) || 0.25;
module.exports.VIOLIN_BIN_PREFIX = process.env.VIOLIN_BIN_PREFIX || "readct-";
module.exports.WRITE_FILES = process.env.WRITE_FILES === "true";
module.exports.DEBUGGING = process.env.DEBUGGING === "true";
module.exports.PARSE_GENES = process.env.PARSE_GENES ? process.env.PARSE_GENES.split(',') : undefined;
module.exports.BARCODE_FILE_CELL_NAME_IDX = parseInt(process.env.BARCODE_FILE_CELL_NAME_IDX) || 0;
module.exports.BARCODE_FILE_CLUSTER_ID_IDX = parseInt(process.env.BARCODE_FILE_CLUSTER_ID_IDX) || 1;
module.exports.VIOLIN_PLOT_JITTER_ENABLE = process.env.VIOLIN_PLOT_JITTER_ENABLE === "true";
module.exports.VIOLIN_PLOT_JITTER_SEED = process.env.VIOLIN_PLOT_JITTER_SEED || "apr1619";
module.exports.VIOLIN_PLOT_JITTER_DIVISOR = parseFloat(process.env.VIOLIN_PLOT_JITTER_DIVISOR) || 200;
module.exports.VIOLIN_PLOT_JITTER_OFFSET = parseFloat(process.env.VIOLIN_PLOT_JITTER_OFFSET) || 1;
module.exports.LOG_DIR = process.env.LOG_DIR || "./log";
module.exports.LOG_UNMATCHED_BARCODE_FILE = process.env.LOG_UNMATCHED_BARCODE_FILE || "unmatchedBarcodes.txt";
module.exports.LOG_UNMATCHED_BARCODE_HEADER = process.env.LOG_UNMATCHED_BARCODE_HEADER || "unmatched_barcode";
module.exports.GENE_LIST_FILENAME = process.env.GENE_LIST_FILENAME || 'geneList.csv';
module.exports.GENE_LIST_HEADER = process.env.GENE_LIST_HEADER || 'gene';
module.exports.VIOLIN_PLOT_CHECKER_FILE = process.env.VIOLIN_PLOT_CHECKER_FILE || 'ViolinPlotCheckerOutput.json';
module.exports.VIOLIN_BIN_CHECKER_FILE = process.env.VIOLIN_BIN_CHECKER_FILE || 'ViolinBinCheckerOutput.json';
module.exports.CLUSTER_MAP_FILE = process.env.CLUSTER_MAP_FILE || undefined;
module.exports.LEGEND_FILE = process.env.LEGEND_FILE || undefined;
module.exports.VIOLIN_PLOT_CHECKER_SCRIPT_OUTPUT_FILE = process.env.VIOLIN_PLOT_CHECKER_SCRIPT_OUTPUT_FILE || undefined;
module.exports.VIOLIN_PLOT_CHECKER_CHECK_FILE = process.env.VIOLIN_PLOT_CHECKER_CHECK_FILE || undefined;
module.exports.VIOLIN_BIN_CHECKER_BASE_DIR = process.env.VIOLIN_BIN_CHECKER_BASE_DIR || undefined;
module.exports.CLUSTER_MAP_HEADER = process.env.CLUSTER_MAP_HEADER || 'structure,cell_type,master_cluster_ID,SNDROP_SEQ,MDSCRNA_SEQ,SCRNA_SEQ';
