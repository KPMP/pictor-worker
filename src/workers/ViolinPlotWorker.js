const _ = require('lodash');
const env = require('../util/env');
const log = require('../util/log');
const files = require('../util/files');
const ViolinPlotBinWorker = require('./ViolinPlotBinWorker').ViolinPlotBinWorker;

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
            clusterLegend: {},
            readCountHeader: [],
            barcodeCt: 0,
            readCountRowCt: 0
        };

        return this;
    }

    parseBarcodeToCellMap(inPath) {
        return files.streamRead("parseBarcodeToCellMap", inPath, (line) => {
            const worker = ViolinPlotWorker.getInstance(),
                row = line.split(env.IN_DELIM),
                cell = worker.sanitize(row[0]),
                cluster = worker.sanitize(row[1]);

            if (row && row.length === 2) {
                worker.result.barcodeMap[cell] = cluster;

                worker.result.clusterLegend[cluster] =
                    worker.result.clusterLegend[cluster] ||
                    0;

                worker.result.clusterLegend[cluster]++;
                worker.result.barcodeCt++;
            }
        });
    }

    processReadCountTable(datasetName, inPath, outPath) {
        return files.streamRead("processReadCountTable", inPath, (line) => {
            const worker = ViolinPlotWorker.getInstance(),
                inputCols = line.split(env.IN_DELIM), // this will be factors of 10^4, 10^5 long
                outputRows = [];
            let gene = null,
                skip = false;

            // log.debug(inputCols.length + " columns found");

            if(!worker.result.readCountHeader.length) {
                worker.result.readCountHeader = inputCols;
                //log.debug("+++ Header found: " + JSON.stringify(inputCols));
                return;
            }

            _.forEach(inputCols, (col, i) => {
                if(i === 0) {
                    gene = worker.sanitize(col);
                    skip = env.PARSE_GENES && env.PARSE_GENES.indexOf(gene) === -1;

                    if(skip) {
                        log.debug('!!! Skipping gene ' + gene);
                    }

                    if (!skip && gene) {
                        log.debug('... Processing gene ' + gene);
                    }

                    return;
                }

                if(skip || !gene || !worker.sanitize(worker.result.readCountHeader[i])) {
                    return;
                }

                let cell = worker.sanitize(worker.result.readCountHeader[i]),
                    cluster = worker.sanitize(worker.result.barcodeMap[cell]),
                    readCount = parseFloat(worker.sanitize(col)),
                    row = [ cell, gene, cluster, readCount ];

                if(!cluster) {
                    log.debug('!!! Error: No cluster found for gene/cell ' + gene + '/' + cell);
                }

                //log.debug(row);
                outputRows.push(row);
            });

            if(!skip && gene && gene.length > 0) {
                worker.writeToGeneDatasetFile(
                    outputRows,
                    outPath,
                    gene,
                    datasetName
                );

                worker.result.readCountRowCt++;

                ViolinPlotBinWorker
                    .getInstance()
                    .writeViolinPlotBins(
                        outputRows,
                        outPath,
                        gene,
                        datasetName
                    );
            }
        });
    }

    writeLegend(datasetName, outDir) {
        return new Promise((resolve, reject) => {
            log.debug('... writeLegend');

            const worker = ViolinPlotWorker.getInstance(),
                outPath = [outDir, datasetName + "_" + env.LEGEND_FILENAME].join(env.PATH_DELIM) + (env.OUT_DELIM === "," ? ".csv" : ".txt");

            files.getStreamWriter(outPath, (os) => {
                let clusters = Object.keys(worker.result.clusterLegend);
                clusters.sort((a, b) => parseInt(a) - parseInt(b));

                os.write(env.LEGEND_HEADER + env.ROW_DELIM);

                _.forEach(clusters, (cluster) => {
                    os.write(datasetName + env.OUT_DELIM +
                        cluster + env.OUT_DELIM +
                        worker.result.clusterLegend[cluster] + env.OUT_DELIM + env.ROW_DELIM);
                });

                resolve();
            });
        });
    }

    writeToGeneDatasetFile(rows, basePath, geneName, datasetName) {
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
            resolve();
        });
    }

    sanitize(str) {
        return str ? str.replace(/["']/g, '') : false;
    }
}

module.exports = { ViolinPlotWorker: ViolinPlotWorker };