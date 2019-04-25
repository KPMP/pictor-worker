const env = require('../util/env');
const files = require('../util/files');
const LegendWorker = require('./LegendWorker').LegendWorker;
const _ = require('lodash');

class DownloadFileWorker {
    constructor() {

    }

    static getInstance() {
        if (DownloadFileWorker.instance == null) {
            DownloadFileWorker.instance = new DownloadFileWorker();
        }

        return DownloadFileWorker.instance;
    }

    appendToDownloadFile(rows) {
        return files.getStreamWriter(files.getPath(
            env.DST_DIR, rows[1][1], rows[1][1], env.DOWNLOAD_FILENAME),
            (os, isNew) => {
                const legendWorker = LegendWorker.getInstance();

                if(isNew) {
                    os.write(env.DOWNLOAD_FILE_HEADER + env.ROW_DELIM);
                }

                //Download file column order (cluster_id had been column #3, removed):
                //dataset,barcode,rollup_id,rollup_type,gene,normalized_expression_value

                //Gene row column order:
                //cell, gene, clusterId, rollupId, readCount

                _.forEach(rows, (row) => {
                    os.write([env.DATASET_NAME, row[0],
                        legendWorker.getRollupId(row[2]),
                        legendWorker.getRollupType(row[2]),
                        row[1], row[4]].join(env.OUT_DELIM) + env.ROW_DELIM);
                });

            }, true); // appendMode = true
    }
}

module.exports = {DownloadFileWorker: DownloadFileWorker};