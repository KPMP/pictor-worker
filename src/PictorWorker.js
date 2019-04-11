const fs = require('graceful-fs');
const util = require('util');
const es = require('event-stream');

const PATH_DELIM = "/";
const ROW_DELIM = "\n";

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
            barcodeCt: 0
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
        return new Promise((resolve, reject) => {
            this.log('... processReadCountTable',
                datasetName, inPath,
                "'" + inDelim + "'", outPath, "'" + outDelim + "'");
            resolve();
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

    writeToGeneDatasetFile(row, basePath, geneName, datasetName, fileName, outDelim) {
        const worker = PictorWorker.getInstance();
        const outPath = worker.getOutPath(worker, basePath, geneName, datasetName, fileName, outDelim);

        worker.os = worker.os || {};
        worker.os[geneName] = worker.os[geneName] || {};
        worker.os[geneName][datasetName] = worker.os[geneName][datasetName] || {};

        if(!worker.os[geneName][datasetName][fileName]) {
            worker.os[geneName][datasetName][fileName] =
                fs.createWriteStream(outPath, {flags:'a'});
        }

        worker.os[geneName][datasetName][fileName].write(row.join(outDelim) + ROW_DELIM);
    }

    getOutPath(worker, basePath, geneName, datasetName, fileName, outDelim) {
        let pathElements = [basePath, geneName, datasetName, fileName];
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