const fs = require('graceful-fs');
const util = require('util');

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
        this.result = { barcodeMap: {}, clusterLegend: {} };
        return this;
    }

    parseBarcodeToCellMap(inPath, inDelim) {
        return new Promise((resolve, reject) => {
            console.log('+++ parseBarcodeToCellMap',
                inPath, "'" + inDelim + "'");
            resolve();
        });
    }

    processReadCountTable(datasetName, inPath, inDelim, outPath, outDelim) {
        return new Promise((resolve, reject) => {
            console.log('+++ processReadCountTable',
                datasetName, inPath,
                "'" + inDelim + "'", outPath, "'" + outDelim + "'");
            resolve();
        });
    }

    writeLegend(datasetName, outPath, outDelim) {
        return new Promise((resolve, reject) => {
            console.log('+++ writeLegend',
                datasetName, outPath, "'" + outDelim + "'");
            resolve();
        });
    }

    logResults() {
        return new Promise((resolve, reject) => {
            console.log('+++ logResults');
            resolve();
        });
    }
}

module.exports = { PictorWorker };