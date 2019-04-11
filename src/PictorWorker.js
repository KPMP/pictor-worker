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
            clusterLegend: {}
        };

        return this;
    }

    parseBarcodeToCellMap(inPath, inDelim) {
        const worker = PictorWorker.getInstance();

        return this.streamRead(
            "parseBarcodeToCellMap", inPath, (line) => {
                worker.log(line);
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

    logResults() {
        return new Promise((resolve, reject) => {
            this.log('... logResults');
            resolve();
        });
    }

    streamRead(streamName, inPath, streamFunc) {
        const worker = this;

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