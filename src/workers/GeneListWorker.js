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
            genes: [],
            genesByDataset: []
        };

        return this;
    }

    loadGenes() {
        return new Promise((res, rej) => {
            const worker = GeneListWorker.getInstance();
            const inPath = env.DST_DIR + env.PATH_DELIM + env.GENE_LIST_FILENAME;

            if(fs.existsSync(inPath)) {
                worker.result = JSON.parse(fs.readFileSync(inPath, 'utf8'));
            }

            else {
                log.info('+++ No gene file exists at ' + inPath + '; skipping');
            }

            res();
        });
    }

    putGenes(genes) {
        const worker = GeneListWorker.getInstance();
        let datasetIndex = worker.result.genesByDataset.findIndex((datasetGenes) => datasetGenes.dataset === env.DATASET_NAME);
        if(datasetIndex === -1) {
            worker.result.genesByDataset.push({
                dataset: env.DATASET_NAME,
                genes: [ ]
            });

            datasetIndex = worker.result.genesByDataset.length - 1;
        }

        _.forEach(genes, (gene) => {
            if(gene && gene.length > 0) {

                if(worker.result.genes.indexOf(gene) === -1) {
                    worker.result.genes.push(gene);
                }

                if(worker.result.genesByDataset[datasetIndex].genes.indexOf(gene) === -1) {
                    worker.result.genesByDataset[datasetIndex].genes.push(gene);
                }
            }
        });
    }

    writeGenes() {
        const worker = GeneListWorker.getInstance();
        const outPath = env.DST_DIR + env.PATH_DELIM + env.GENE_LIST_FILENAME;
        log.info('+++ GeneListWorker.writeGenes');

        if(env.DEBUGGING) {
            log.debug(worker.result);
            log.debug('+++ counts by dataset: ');
            _.forEach(worker.result.genesByDataset, (datasetGenes) => {
                log.debug('... ' + datasetGenes.dataset + ': ' + datasetGenes.genes.length);
            });
        }

        return files.getStreamWriter(outPath, (os) => {
            worker.result.genes.sort();
            os.write(JSON.stringify(worker.result, null, 4));
        });
    }
}

module.exports = {GeneListWorker: GeneListWorker};