const fs = require('graceful-fs');
const env = require('../util/env');
const files = require('../util/files');
const log = require('../util/log');

const SCRNA_SEQ = 'SCRNA_SEQ',
    MDSCRNA_SEQ = 'MDSCRNA_SEQ',
    SNDROP_SEQ = 'SNDROP_SEQ',
    STRUCTURE = 'STRUCTURE',
    CELL_TYPE = 'CELL_TYPE',
    MASTER_CLUSTER_ID = 'MASTER_CLUSTER_ID';

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
        this.result = {
            clusterMapIndexes: {},
            masterClusters: {},
            datasetClusters: {
                SCRNA_SEQ: {},
                MDSCRNA_SEQ: {},
                SNDROP_SEQ: {}
            }
        };

        return this;
    }

    loadClusterMap() {
        if(fs.existsSync(env.CLUSTER_MAP_FILE)) {
            log.debug('+++ LegendWorker.loadClusterMap');
            const worker = LegendWorker.getInstance();
            return files.streamRead("LoadClusterMap", env.CLUSTER_MAP_FILE, (line) => {
                const row = line.split(env.IN_DELIM);

                //If this is the header, find indexes of columns for mapping
                if(row.indexOf(STRUCTURE) > -1) {
                    worker.result.clusterMapIndexes.STRUCTURE = row.indexOf(STRUCTURE);
                    worker.result.clusterMapIndexes.CELL_TYPE = row.indexOf(CELL_TYPE);
                    worker.result.clusterMapIndexes.MASTER_CLUSTER_ID = row.indexOf(MASTER_CLUSTER_ID);
                    worker.result.clusterMapIndexes.SCRNA_SEQ = row.indexOf(SCRNA_SEQ);
                    worker.result.clusterMapIndexes.MDSCRNA_SEQ = row.indexOf(MDSCRNA_SEQ);
                    worker.result.clusterMapIndexes.SNDROP_SEQ = row.indexOf(SNDROP_SEQ);
                    return;
                }

                const indexes = worker.result.clusterMapIndexes,
                    structure = row[indexes.STRUCTURE],
                    cellType = row[indexes.CELL_TYPE],
                    masterClusterId = row[indexes.MASTER_CLUSTER_ID],
                    scrnaSeqId = row[indexes.SCRNA_SEQ],
                    mdscrnaSeqId = row[indexes.MDSCRNA_SEQ],
                    sndropSeqId = row[indexes.SNDROP_SEQ],
                    clusterRow = {structure, cellType, masterClusterId};

                if(!masterClusterId) {
                    return;
                }

                worker.result.datasetClusters.SCRNA_SEQ[scrnaSeqId] =
                    worker.result.datasetClusters.MDSCRNA_SEQ[mdscrnaSeqId] =
                    worker.result.datasetClusters.SNDROP_SEQ[sndropSeqId] =
                    worker.result.masterClusters[masterClusterId] = clusterRow;
            });
        }

        else {
            const error = '!!! No cluster map file exists at ' + env.CLUSTER_MAP_FILE + '; stopping';
            log.info(error);
            return new Promise((res, rej) => rej(error));
        }
    }

    writeLegend() {
        const worker = LegendWorker.getInstance();
        const outPath = env.DST_DIR + env.PATH_DELIM + env.LEGEND_FILE;
        log.debug('+++ LegendWorker.writeLegend');
        log.debug(worker.result);
        return files.getStreamWriter(outPath, (os) => {
            os.write(JSON.stringify({
                masterClusters: worker.result.masterClusters,
                datasetClusters: worker.result.datasetClusters
            }, null, 4));
        });
    }
}

module.exports = {LegendWorker: LegendWorker};