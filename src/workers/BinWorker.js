const env = require('../util/env');
const files = require('../util/files');
const log = require("../util/log");
const _ = require('lodash');

class BinWorker {

    constructor() {
        this.clearData();
    }

    static getInstance() {
        if (BinWorker.instance == null) {
            BinWorker.instance = new BinWorker();
        }

        return BinWorker.instance;
    }

    clearData() {
        this.result = {
            genes: []
        };

        return this;
    }

    writeViolinPlotBins(rows, basePath, geneName, datasetName) {
        const worker = BinWorker.getInstance();
        worker.calculateBins(geneName, rows);
        worker.writeGeneToVolinPlotFile(basePath, datasetName, geneName);
    }

    calculateBins(geneName, rows) {
        _.forEach(rows, (row) => {
            const worker = BinWorker.getInstance(),
                readCt = row[3],
                cluster = row[2];

            // log.debug(JSON.stringify(row));

            if (!cluster || cluster.match(/[^0-9]/g)) {
                return;
            }

            worker.result.genes[geneName] = worker.result.genes[geneName] || { bins: [], counts: [], maxBin: 0};
            worker.result.genes[geneName].bins[cluster] = worker.result.genes[geneName].bins[cluster] || [];
            worker.result.genes[geneName].counts[cluster] = worker.result.genes[geneName].counts[cluster] || 0;
            worker.result.genes[geneName].counts[cluster]++;

            let i = 0;
            while (true) {
                let bin = env.VIOLIN_BIN_PREFIX + i;
                worker.result.genes[geneName].bins[cluster][bin] = worker.result.genes[geneName].bins[cluster][bin] || 0;
                // log.debug('Bin: ' + bin);
                if (readCt - i < env.VIOLIN_BIN_BANDWIDTH) {
                    worker.result.genes[geneName].bins[cluster][bin]++;
                    worker.result.genes[geneName].maxBin = Math.max(worker.result.genes[geneName].maxBin, i);
                    return;
                }

                else {
                    i += env.VIOLIN_BIN_BANDWIDTH;
                }
            }
        });
    }

    writeGeneToVolinPlotFile(basePath, datasetName, geneName) {
        const worker = BinWorker.getInstance(),
            outPath = files.getPath(basePath, geneName, datasetName, env.VIOLIN_BIN_FILENAME);

        files.getStreamWriter(outPath, (os, isNew) => {
            let bins = [], i = 0;

            while (i < worker.result.genes[geneName].maxBin) {
                bins.push(env.VIOLIN_BIN_PREFIX + i);
                i += env.VIOLIN_BIN_BANDWIDTH;
            }

            let header = env.VIOLIN_BIN_HEADER + bins.join(','),
                rows = Object.keys(worker.result.genes[geneName].bins).map((cluster) => {
                return [datasetName, geneName, cluster].join(env.OUT_DELIM) +
                    env.OUT_DELIM + bins.map((bin) => {
                        let val = worker.result.genes[geneName].bins[cluster][bin];
                        return val ? val : 0;
                    }).join(env.OUT_DELIM);
            });

            os.write(header + env.ROW_DELIM + rows.join(env.ROW_DELIM));
        });
    }
}

module.exports = { BinWorker };
