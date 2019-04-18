const fs = require('graceful-fs');
const env = require('../util/env');
const files = require('../util/files');
const log = require('../util/log');
const _ = require('lodash');

class LegendWorker {
    constructor() {
        this.clearData();
    }

    static getInstance() {
        if (LegendWorker.instance == null) {
            LegendWorker.instance = new LegendWorker();
        }

        return LegendWorker.instance;
    }

    clearData() {
        this.data = {
            clusterMap: []
        };

        this.result = {
            legend: {}
        };

        return this;
    }

    loadClusterMap() {
        const inPath = env.DST_DIR + env.PATH_DELIM + env.CLUSTER_MAP_FILENAME;
        if(fs.existsSync(inPath)) {
            return files.streamRead("LoadClusterMap", inPath, (line) => {
                if(line === env.GENE_LIST_HEADER) {
                    return;
                }

                LegendWorker.getInstance().putGenes([line]);
            });
        }

        else {
            const error = '!!! No cluster map file exists at ' + inPath + '; stopping';
            log.info(error);
            return new Promise((res, rej) => rej(error));
        }
    }

    writeLegend() {
        const outPath = env.DST_DIR + env.PATH_DELIM + env.GENE_LIST_FILENAME;
        return files.getStreamWriter(outPath, (os) => {
            const worker = LegendWorker.getInstance();
            let genes = worker.result.genes;
            genes.sort();
            os.write(env.GENE_LIST_HEADER + env.ROW_DELIM);
            _.forEach(genes, (gene) => {
                os.write(gene + env.ROW_DELIM);
            });
        });
    }
}

module.exports = {LegendWorker: LegendWorker};