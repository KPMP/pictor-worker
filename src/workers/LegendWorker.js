const fs = require('graceful-fs');
const env = require('../util/env');
const files = require('../util/files');
const log = require('../util/log');

const SCRNA_SEQ = 'SCRNA-SEQ',
    MDSCRNA_SEQ = 'MDSCRNA-SEQ',
    SNDROP_SEQ = 'SNDROP-SEQ',
    STRUCTURE = 'STRUCTURE',
    ROLLUP_ID = 'ROLLUP_ID',
    ROLLUP_TYPE = 'ROLLUP_TYPE',
    CLUSTER_TYPE = 'CLUSTER_TYPE',
    CLUSTER_ID = 'CLUSTER_ID';

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
            clusters: {},
            datasetClusters: {
                'SCRNA-SEQ': {},
                'MDSCRNA-SEQ': {},
                'SNDROP-SEQ': {}
            }
        };

        return this;
    }

    getClusterIdFromDatasetClusterId(datasetClusterId) {
        const dataset = this.result.datasetClusters[env.DATASET_NAME],
            datasetCluster = dataset ? dataset[datasetClusterId] : null;
        return datasetCluster ? datasetCluster.clusterId : -1;
    }

    getClusterType(clusterId) {
        const cluster = this.result.clusters[clusterId];
        return cluster ? cluster.clusterType : "NA";
    }

    getRollupId(clusterId) {
        const cluster = this.result.clusters[clusterId];
        return cluster ? cluster.rollupId : -1;
    }

    getRollupType(clusterId) {
        const cluster = this.result.clusters[clusterId];
        return cluster ? cluster.rollupType : "NA";
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
                    worker.result.clusterMapIndexes.ROLLUP_TYPE = row.indexOf(ROLLUP_TYPE);
                    worker.result.clusterMapIndexes.ROLLUP_ID = row.indexOf(ROLLUP_ID);
                    worker.result.clusterMapIndexes.CLUSTER_TYPE = row.indexOf(CLUSTER_TYPE);
                    worker.result.clusterMapIndexes.CLUSTER_ID = row.indexOf(CLUSTER_ID);
                    worker.result.clusterMapIndexes[SCRNA_SEQ] = row.indexOf(SCRNA_SEQ);
                    worker.result.clusterMapIndexes[SNDROP_SEQ] = row.indexOf(SNDROP_SEQ);
                    worker.result.clusterMapIndexes[MDSCRNA_SEQ] = row.indexOf(MDSCRNA_SEQ);

                    log.debug(worker.result.clusterMapIndexes);

                    return;
                }

                const indexes = worker.result.clusterMapIndexes,
                    structure = row[indexes.STRUCTURE],
                    clusterType = row[indexes.CLUSTER_TYPE],
                    clusterId = row[indexes.CLUSTER_ID],
                    rollupType = row[indexes.ROLLUP_TYPE],
                    rollupId = row[indexes.ROLLUP_ID],
                    scrnaSeqId = row[indexes[SCRNA_SEQ]],
                    mdscrnaSeqId = row[indexes[MDSCRNA_SEQ]],
                    sndropSeqId = row[indexes[SNDROP_SEQ]],
                    clusterRow = {structure, rollupType, rollupId, clusterType, clusterId};

                if(!clusterId) {
                    return;
                }

                worker.result.datasetClusters[SCRNA_SEQ][scrnaSeqId] =
                    worker.result.datasetClusters[MDSCRNA_SEQ][mdscrnaSeqId] =
                    worker.result.datasetClusters[SNDROP_SEQ][sndropSeqId] =
                    worker.result.clusters[clusterId] = clusterRow;
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
                clusters: worker.result.clusters,
                datasetClusters: worker.result.datasetClusters
            }, null, 4));
        });
    }
}

module.exports = {LegendWorker: LegendWorker};