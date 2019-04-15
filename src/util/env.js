require('dotenv').config();

module.exports.PATH_DELIM = process.env.PATH_DELIM || "/";
module.exports.ROW_DELIM = process.env.ROW_DELIM || "\n";
module.exports.OUT_DELIM = process.env.OUT_DELIM || ",";
module.exports.IN_DELIM = process.env.IN_DELIM || "\t";
module.exports.LEGEND_FILENAME = process.env.LEGEND_FILENAME || "Legend";
module.exports.LEGEND_HEADER = process.env.LEGEND_HEADER || "datasetcluster,cellct,mastercluster";
module.exports.VIOLIN_PLOT_FILENAME = process.env.VIOLIN_PLOT_FILENAME || "violinPlot";
module.exports.VIOLIN_PLOT_HEADER = process.env.VIOLIN_PLOT_HEADER || "cellname,gene,cluster,readcount";
module.exports.WRITE_FILES = process.env.WRITE_FILES === "true";
module.exports.DEBUGGING = process.env.DEBUGGING === "true";
module.exports.DATASET_NAME = process.env.DATASET_NAME || undefined;
module.exports.DST_DIR = process.env.DST_DIR || undefined;
module.exports.BARCODE_FILE = process.env.BARCODE_FILE || undefined;
module.exports.DATA_FILE = process.env.DATA_FILE || undefined;
