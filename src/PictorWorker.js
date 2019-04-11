const fs = require('graceful-fs');
const util = require('util');
const es = require('event-stream');
const _ = require('lodash');

const PATH_DELIM = "/";
const ROW_DELIM = "\n";
const VIOLIN_PLOT_FILENAME = "violinPlot";
const VIOLIN_PLOT_HEADER = "cellname,gene,readcount,cluster";

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

    parseBarcodeToCellMap(inPath, inDelim) {
        const worker = PictorWorker.getInstance();

        return worker.streamRead("parseBarcodeToCellMap", inPath, (line) => {
            const row = line.split(inDelim);

            if (row && row.length === 2) {
                worker.result.barcodeMap[row[0]] = row[1];

                worker.result.clusterLegend[row[1]] =
                    worker.result.clusterLegend[row[1]] ||
                    0;

                worker.result.clusterLegend[row[1]]++;
                worker.result.barcodeCt++;
            }
        });
    }

    processReadCountTable(datasetName, inPath, inDelim, outPath, outDelim) {
        const worker = PictorWorker.getInstance();

        return worker.streamRead("processReadCountTable", inPath, (line) => {
            const inputRow = line.split(inDelim), // this will be factors of 10^4, 10^5 long
                outputRows = [];
            let gene = null;

            //TODO If we have no header, process that first
            if(!worker.result.readCountHeader) {
                worker.result.readCountHeader = inputRow;
                return;
            }

            _.forEach(inputRow, (col, i) => {
                if(i === 0) {
                    gene = col;
                    return;
                }

                outputRows.push([
                    worker.result.readCountHeader[i], //cellname
                    gene, //gene
                    worker.result.barcodeMap[worker.result.readCountHeader[i]], // cluster
                    col //readcount
                ]);
            });

            worker.writeToGeneDatasetFile(
                rows,
                outPath,
                gene,
                datasetName,
                VIOLIN_PLOT_FILENAME,
                outDelim,
                VIOLIN_PLOT_HEADER
            );

            worker.result.readCountRowCt++;
        });
    }

    writeLegend(datasetName, outPath, outDelim) {
        return new Promise((resolve, reject) => {
            this.log('... writeLegend',
                datasetName, outPath, "'" + outDelim + "'");
            resolve();
        });
    }

    logResult() {
        return new Promise((resolve, reject) => {
            this.log('... logResult');
            this.log(PictorWorker.getInstance().result);
            resolve();
        });
    }

    writeToGeneDatasetFile(rows, basePath, geneName, datasetName, fileName, outDelim, header) {
        const worker = PictorWorker.getInstance();
        const outPath = worker.getOutPath(worker, basePath, geneName, datasetName, fileName, outDelim);

        worker.os = worker.os || {};
        worker.os[geneName] = worker.os[geneName] || {};
        worker.os[geneName][datasetName] = worker.os[geneName][datasetName] || {};

        if(!worker.os[geneName][datasetName][fileName]) {
            worker.os[geneName][datasetName][fileName] = fs.createWriteStream(outPath, {flags:'a'});
            worker.os[geneName][datasetName][fileName].write(header + ROW_DELIM);
        }

        worker.os[geneName][datasetName][fileName].write(
            rows.map((row) => row.join(outDelim))
                .join(ROW_DELIM) + ROW_DELIM
        );
    }

    getOutPath(worker, basePath, geneName, datasetName, fileName, outDelim) {
        let pathElements = [basePath, geneName, datasetName + "_" + fileName];
        let output = pathElements.join(PATH_DELIM) + (outDelim === "," ? ".csv" : ".txt");

        let test = pathElements.join('').match(/[^-A-Za-z0-9.]/g);
        if(test && test.length) {
            worker.log('!!! Suspicious path detected: ' + output);
        }

        return output;
    }

    streamRead(streamName, inPath, streamFunc) {
        const worker = PictorWorker.getInstance();

        return new Promise((resolve, reject) => {
            worker.log('... ' + streamName, inPath);

            if(!fs.existsSync(inPath)) {
                reject("!!! streamRead error: No file found at ", inPath);
                return;
            }

            let s = fs.createReadStream(inPath)
                .pipe(es.split())
                .pipe(es.mapSync((line) => {
                    streamFunc(line);
                })
                .on('error', function(err){
                    reject(err);
                })
                .on('end', function(){
                    worker.log('+++ ' + streamName + ' done');
                    resolve();
                }));
        });
    }

    log(msg) {
        console.log(
            ((Date.now() - this.result.startTime) / 1000) +
            ": ", msg
        );
    }

}

module.exports = { PictorWorker };