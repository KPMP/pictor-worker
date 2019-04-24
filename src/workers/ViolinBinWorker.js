const env = require('../util/env');
const files = require('../util/files');
const log = require("../util/log");
const _ = require('lodash');

class ViolinBinWorker {

    constructor() {
        this.clearData();
    }

    static getInstance() {
        if (ViolinBinWorker.instance == null) {
            ViolinBinWorker.instance = new ViolinBinWorker();
        }

        return ViolinBinWorker.instance;
    }

    clearData() {
        this.result = {
            genes: []
        };

        return this;
    }

    writeViolinPlotBins(rows, basePath, geneName, datasetName) {
        const worker = ViolinBinWorker.getInstance();
        worker.calculateBins(geneName, rows);
        worker.writeViolinBinFile(basePath, datasetName, geneName);
    }

    calculateBins(geneName, rows) {
        _.forEach(rows, (row) => {
            const worker = ViolinBinWorker.getInstance(),
                readCt = row[4],
                rollupId = row[3];

            // log.debug(JSON.stringify(row));

            if (!rollupId || !Number(rollupId)) {
                return;
            }

            worker.result.genes[geneName] = worker.result.genes[geneName] || { bins: [], counts: [], maxBin: 0};
            worker.result.genes[geneName].bins[rollupId] = worker.result.genes[geneName].bins[rollupId] || [];
            worker.result.genes[geneName].counts[rollupId] = worker.result.genes[geneName].counts[rollupId] || 0;
            worker.result.genes[geneName].counts[rollupId]++;

            let i = 0;

            while (true) {
                let bin = env.VIOLIN_BIN_PREFIX + i;
                worker.result.genes[geneName].bins[rollupId][bin] = worker.result.genes[geneName].bins[rollupId][bin] || 0;

                if (readCt - i < env.VIOLIN_BIN_BANDWIDTH) {
                    worker.result.genes[geneName].bins[rollupId][bin]++;
                    worker.result.genes[geneName].maxBin = Math.max(worker.result.genes[geneName].maxBin, i);
                    return;
                }

                else {
                    i += env.VIOLIN_BIN_BANDWIDTH;
                }
            }
        });
    }

    writeViolinBinFile(basePath, datasetName, geneName) {
        const worker = ViolinBinWorker.getInstance(),
            outPath = files.getPath(basePath, geneName, datasetName, env.VIOLIN_BIN_FILENAME);

        files.getStreamWriter(outPath, (os, isNew) => {
            let bins = [], i = 0;

            while (i <= worker.result.genes[geneName].maxBin) {
                bins.push(env.VIOLIN_BIN_PREFIX + i);
                i += env.VIOLIN_BIN_BANDWIDTH;
            }

            let header = env.VIOLIN_BIN_HEADER + bins.join(','),
                rows = Object.keys(worker.result.genes[geneName].bins).map((rollupId) => {
                return [datasetName, geneName, rollupId].join(env.OUT_DELIM) +
                    env.OUT_DELIM + bins.map((bin) => {
                        let val = worker.result.genes[geneName].bins[rollupId][bin];
                        return val ? val : 0;
                    }).join(env.OUT_DELIM);
            });

            os.write(header + env.ROW_DELIM + rows.join(env.ROW_DELIM));
        });
    }
}

module.exports = { ViolinBinWorker: ViolinBinWorker };
