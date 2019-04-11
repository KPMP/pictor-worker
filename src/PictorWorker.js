const fs = require('graceful-fs');
const util = require('util');
const es = require('event-stream');

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