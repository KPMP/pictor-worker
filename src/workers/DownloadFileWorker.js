const env = require('../util/env');
const files = require('../util/files');
const moment = require('moment');
const log = require('../util/log');
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
            env.DST_DIR, rows[1][1], rows[1][1],
            env.DOWNLOAD_FILENAME + '_' + moment().format(env.DOWNLOAD_MOMENT_FORMAT)),
            (os, isNew) => {
                const legendWorker = LegendWorker.getInstance();

                if(isNew) {
                    os.write(env.DOWNLOAD_FILE_HEADER + env.ROW_DELIM);
                }

                //Download file column order:
                //dataset,barcode,cluster_id,cluster_name,gene,normalized_expression_value

                //Gene row column order:
                //cellname,gene,cluster,readcount

                _.forEach(rows, (row) => {
                    os.write([env.DATASET_NAME, row[0], row[2],
                        legendWorker.getMasterClusterName(row[2]),
                        row[1], row[3]].join(env.OUT_DELIM) + env.ROW_DELIM);
                });

            }, true); // appendMode = true
    }
}

module.exports = {DownloadFileWorker: DownloadFileWorker};