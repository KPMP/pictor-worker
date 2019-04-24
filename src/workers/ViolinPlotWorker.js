const _ = require('lodash');
const env = require('../util/env');
const log = require('../util/log');
const files = require('../util/files');
const seedrandom = require('seedrandom');
const ViolinBinWorker = require('./ViolinBinWorker').ViolinBinWorker;
const DownloadFileWorker = require('./DownloadFileWorker').DownloadFileWorker;
const LegendWorker = require('./LegendWorker').LegendWorker;

const rng = seedrandom(env.VIOLIN_PLOT_JITTER_SEED);

class ViolinPlotWorker {

    constructor() {
        this.clearData();
    }

    static getInstance() {
        if(ViolinPlotWorker.instance == null) {
            ViolinPlotWorker.instance = new ViolinPlotWorker();
        }

        return ViolinPlotWorker.instance;
    }

    clearData() {
        this.result = {
            startTime: Date.now(),
            barcodeMap: {},
            readCountHeader: [],
            barcodeCt: 0,
            readCountRowCt: 0,
            unmatchedBarcodes: [],
            unmappedToRollupBarcodes: []
        }

        return this;
    }

    parseBarcodeToCellMap(inPath) {
        return files.streamRead("parseBarcodeToCellMap", inPath, (line) => {
            const worker = ViolinPlotWorker.getInstance(),
                row = line.split(env.IN_DELIM),
                cell = files.sanitize(row[env.BARCODE_FILE_CELL_NAME_IDX]),
                cluster = files.sanitize(row[env.BARCODE_FILE_CLUSTER_ID_IDX]);

            if (row && row.length) {
                worker.result.barcodeMap[cell] = cluster;
                worker.result.barcodeCt++;
            }
        });
    }

    processReadCountTable(datasetName, inPath, outPath) {
        return files.streamRead("processReadCountTable", inPath, (line) => {
            const worker = ViolinPlotWorker.getInstance(),
                legendWorker = LegendWorker.getInstance(),
                inputCols = line.split(env.IN_DELIM), // this will be factors of 10^4, 10^5 long
                outputRows = [];
            let gene = null,
                skip = false,
                maxReadCount = 0,
                readCountCt = 0;

            if(!worker.result.readCountHeader.length) {
                worker.result.readCountHeader = inputCols;
                return;
            }

            _.forEach(inputCols, (col, i) => {
                if(i === 0) {
                    gene = files.sanitize(col);
                    skip = env.PARSE_GENES && env.PARSE_GENES.indexOf(gene) === -1;
                    return;
                }

                if(skip || !gene || !files.sanitize(worker.result.readCountHeader[i])) {
                    return;
                }

                let cellHeaderIndex = i - 1,
                    cell = files.sanitize(worker.result.readCountHeader[cellHeaderIndex]),
                    datasetClusterId = files.sanitize(worker.result.barcodeMap[cell]);

                if(!datasetClusterId) {
                    if (worker.result.unmatchedBarcodes.indexOf(cell) === -1) {
                        log.debug('!!! Error: No cluster found for gene/cell ' + gene + '/' + cell + '; skipping');
                        worker.result.unmatchedBarcodes.push(cell);
                    }
                    return;
                }

                let readCount = worker.jitter(parseFloat(files.sanitize(col))),
                    clusterId = legendWorker.getClusterIdFromDatasetClusterId(datasetClusterId),
                    rollupId = legendWorker.getRollupId(clusterId);

                if(rollupId === -1) {
                    if (worker.result.unmappedToRollupBarcodes.indexOf(cell) === -1) {
                        log.debug('!!! Warning: No rollup found for gene/cell ' + gene + '/' + cell + '; skipping');
                        worker.result.unmappedToRollupBarcodes.push(cell);
                    }
                    return;
                }

                let row = [ cell, gene, clusterId, rollupId, readCount ];
                    maxReadCount = Math.max(maxReadCount, readCount);

                readCountCt++;

                //log.debug(row);
                outputRows.push(row);
            });

            if(!skip && gene && gene.length > 0) {

                log.info('... Parsed ' + readCountCt + ' reads for ' + gene + '; max: ' + maxReadCount);
                worker.result.readCountRowCt++;

                worker.writeViolinPlotFile(
                    outputRows,
                    outPath,
                    gene,
                    datasetName
                );

                ViolinBinWorker
                    .getInstance()
                    .writeViolinPlotBins(
                        outputRows,
                        outPath,
                        gene,
                        datasetName
                    );

                DownloadFileWorker
                    .getInstance()
                    .appendToDownloadFile(outputRows);
            }
        });
    }

    writeViolinPlotFile(rows, basePath, geneName, datasetName) {
        const outPath = files.getPath(basePath, geneName, datasetName, env.VIOLIN_PLOT_FILENAME);
        files.getStreamWriter(outPath, (os, isNew) => {
            isNew && os.write(env.VIOLIN_PLOT_HEADER + env.ROW_DELIM);
            os.write(rows.map((row) => row.join(env.OUT_DELIM)).join(env.ROW_DELIM));
        });
    }

    logResult() {
        const worker = ViolinPlotWorker.getInstance();
        return new Promise((resolve, reject) => {
            log.debug('... logResult');
            log.info('Barcode ct: ' + worker.result.barcodeCt);
            log.info('Read count row ct: ' + worker.result.readCountRowCt);
            log.info('Runtime: ' + ((Date.now() - this.result.startTime) / 1000) + "s");
            log.info('Unmatched barcode ct: ' + this.result.unmatchedBarcodes.length);
            log.info('Barcodes unmapped to a rollup ct: ' + this.result.unmappedToRollupBarcodes.length);

            files.getStreamWriter(env.LOG_DIR + env.PATH_DELIM + env.LOG_UNMATCHED_BARCODE_FILE, (os) => {
                os.write(env.LOG_UNMATCHED_BARCODE_HEADER + env.ROW_DELIM);
                os.write(worker.result.unmatchedBarcodes.join(env.ROW_DELIM));
            });

            files.getStreamWriter(env.LOG_DIR + env.PATH_DELIM + env.LOG_UNMAPPED_ROLLUP_BARCODE_FILE, (os) => {
                os.write(env.LOG_UNMAPPED_ROLLUP_BARCODE_HEADER + env.ROW_DELIM);
                os.write(worker.result.unmappedToRollupBarcodes.join(env.ROW_DELIM));
            });

            resolve();
        });
    }

    jitter(val) {
        return !env.VIOLIN_PLOT_JITTER_ENABLE ?
            val :
            val + env.VIOLIN_PLOT_JITTER_OFFSET + rng() / env.VIOLIN_PLOT_JITTER_DIVISOR;
    }
}

module.exports = { ViolinPlotWorker: ViolinPlotWorker };