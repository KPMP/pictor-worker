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
        this.result = {
            genes: []
        };

        return this;
    }

    loadGenes() {
        return new Promise((res, rej) => {
            const worker = GeneListWorker.getInstance();
            const inPath = env.DST_DIR + env.PATH_DELIM + env.GENE_LIST_FILENAME;
            if(fs.existsSync(inPath)) {
                worker.result.genes = JSON.parse(fs.readFileSync(inPath, 'utf8')).genes;
            }

            else {
                log.info('+++ No gene file exists at ' + inPath + '; skipping');
                res();
            }
        });
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
        const worker = GeneListWorker.getInstance();
        const outPath = env.DST_DIR + env.PATH_DELIM + env.GENE_LIST_FILENAME;
        log.info('+++ GeneListWorker.writeGenes');
        log.info(worker.result);
        return files.getStreamWriter(outPath, (os) => {
            let genes = worker.result.genes;
            genes.sort();
            os.write(JSON.stringify({genes: genes}, null, 4));
        });
    }
}

module.exports = {GeneListWorker: GeneListWorker};