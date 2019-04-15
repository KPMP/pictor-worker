const _ = require('lodash');
const env = require('./util/env');
const log = require('./util/log');
const files = require('./util/files');

class PictorWorker {

    constructor() {
        this.clearData();
    }

    static getInstance() {
        if(PictorWorker.instance == null) {
            PictorWorker.instance = new PictorWorker();
        }

        return PictorWorker.instance;
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
            const worker = PictorWorker.getInstance(),
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
            const worker = PictorWorker.getInstance(),
                inputCols = line.split(env.IN_DELIM), // this will be factors of 10^4, 10^5 long
                outputRows = [];
            let gene = null;

            //log.debug("+++ " + inputCols.length + " columns found");

            if(!worker.result.readCountHeader.length) {
                worker.result.readCountHeader = inputCols;
                //log.debug("+++ Header found: " + JSON.stringify(inputCols));
                return;
            }

            _.forEach(inputCols, (col, i) => {
                if(i === 0) {
                    gene = worker.sanitize(col);
                    if (gene) {
                        log.info("... Processing gene " + gene);
                    }
                    return;
                }

                if(!gene || !worker.sanitize(worker.result.readCountHeader[i])) {
                    return;
                }

                let cell = worker.sanitize(worker.result.readCountHeader[i]),
                    cluster = worker.sanitize(worker.result.barcodeMap[worker.result.readCountHeader[i]]),
                    readCount = parseFloat(worker.sanitize(col)),
                    row = [ cell, gene, cluster, readCount ];

                if(!cluster) {
                    log.debug('!!! Error: No cluster found for gene/cell ' + gene + '/' + cell);
                }

                //log.debug(row);
                outputRows.push(row);
            });

            if(gene && gene.length > 0) {
                worker.writeToGeneDatasetFile(
                    outputRows,
                    outPath,
                    gene,
                    datasetName,
                    env.VIOLIN_PLOT_FILENAME,
                    env.VIOLIN_PLOT_HEADER
                );

                worker.result.readCountRowCt++;
            }
        });
    }

    writeLegend(datasetName, outDir) {
        return new Promise((resolve, reject) => {
            log.debug('... writeLegend');

            const worker = PictorWorker.getInstance(),
                outPath = [outDir, datasetName + "_" + env.LEGEND_FILENAME].join(env.PATH_DELIM) + (env.OUT_DELIM === "," ? ".csv" : ".txt");

            files.getStreamWriter(outPath, (os) => {
                let clusters = Object.keys(worker.result.clusterLegend);
                clusters.sort((a, b) => { console.log(a, b); return parseInt(a) - parseInt(b)});

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

    writeToGeneDatasetFile(rows, basePath, geneName, datasetName, fileName, header) {
        const outPath = PictorWorker.getInstance().getGeneDatasetOutPath(basePath, geneName, datasetName, fileName);
        files.getStreamWriter(outPath, (os, isNew) => {
            isNew && os.write(header + env.ROW_DELIM);
            os.write(rows.map((row) => row.join(env.OUT_DELIM)).join(env.ROW_DELIM));
        });
    }

    getGeneDatasetOutPath(basePath, geneName, datasetName, fileSuffix) {
        let fileName = datasetName + "_" + fileSuffix + (env.OUT_DELIM === "," ? ".csv" : ".txt"),
            pathElements = [basePath, geneName[0], geneName, fileName],
            output = pathElements.join(env.PATH_DELIM),
            test = [geneName, fileName].join('').match(/[^-_.A-Za-z0-9]/g);

        if(test && test.length) {
            log.info('!!! Suspicious path detected: ' + output);
        }

        return output;
    }

    logResult() {
        const worker = PictorWorker.getInstance();
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

module.exports = { PictorWorker };