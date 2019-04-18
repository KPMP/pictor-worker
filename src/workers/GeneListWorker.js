const fs = require('graceful-fs');
const env = require('../util/env');
const files = require('../util/files');
const log = require('../util/log');
const _ = require('lodash');

class GeneListWorker {
    constructor() {
        this.clearData();
    }

    static getInstance() {
        if (GeneListWorker.instance == null) {
            GeneListWorker.instance = new GeneListWorker();
        }

        return GeneListWorker.instance;
    }

    clearData() {

        this.data = [];

        this.result = {
            genes: [],
            clusterMap: []
        };

        return this;
    }

    loadGenes() {
        const inPath = env.DST_DIR + env.PATH_DELIM + env.GENE_LIST_FILENAME;
        if(fs.existsSync(inPath)) {
            return files.streamRead("LoadGenes", inPath, (line) => {
                if(line === env.GENE_LIST_HEADER) {
                    return;
                }

                GeneListWorker.getInstance().putGenes([line]);
            });
        }

        else {
            log.info('+++ No gene file exists at ' + inPath + '; skipping');
            return new Promise((res, rej) => res());
        }
    }

    putGenes(genes) {
        const worker = GeneListWorker.getInstance();
        _.forEach(genes, (gene) => {
            if(gene && gene.length > 0 && worker.result.genes.indexOf(gene) === -1) {
                worker.result.genes.push(gene);
            }
        });
    }

    writeGenes() {
        const outPath = env.DST_DIR + env.PATH_DELIM + env.GENE_LIST_FILENAME;
        return files.getStreamWriter(outPath, (os) => {
            const worker = GeneListWorker.getInstance();
            let genes = worker.result.genes;
            genes.sort();
            os.write(env.GENE_LIST_HEADER + env.ROW_DELIM);
            _.forEach(genes, (gene) => {
                os.write(gene + env.ROW_DELIM);
            });
        });
    }
}

module.exports = {GeneListWorker: GeneListWorker};