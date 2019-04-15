const es = require('event-stream');
const fs = require('graceful-fs');

const BANDWIDTH = 0.25;
const INPUT = './SCRNA-SEQ_violinPlot.csv';
const VIOLIN_BINS_HEADER = 'cluster,';
const ROW_DELIM = "\n";
const BIN_PREFIX = 'readct-';
const DELIM = ',';

parseLine = (line) => {
    let row = line.split(','),
        readCt = row[3],
        cluster = row[2];

    if(!cluster || cluster.match(/[^0-9]/g)) {
        return;
    }

    clusters.bins[cluster] = clusters.bins[cluster] || [];
    clusters.counts[cluster] = clusters.counts[cluster] || 0;
    clusters.counts[cluster]++;

    let i = 0;
    while(true) {
        let bin = BIN_PREFIX + i;
        clusters.bins[cluster][bin] = clusters.bins[cluster][bin] || 0;
        if(readCt - i < BANDWIDTH) {
            clusters.bins[cluster][bin]++;
            clusters.maxBin = Math.max(clusters.maxBin, i);
            return;
        }

        else {
            i += BANDWIDTH;
        }
    }
}

writeCsv = () => {
    let bins = [], i = 0;

    while(i < clusters.maxBin) {
        bins.push(BIN_PREFIX + i);
        i += BANDWIDTH;
    }

    let header = VIOLIN_BINS_HEADER + bins.join(',');

    let rows = Object.keys(clusters.bins).map((cluster) => {
        return cluster + DELIM + bins.map((bin) => {
            let val = clusters.bins[cluster][bin];
            return val ? val : 0;
        }).join(DELIM);
    });

    let csv = header + ROW_DELIM + rows.join(ROW_DELIM);
    console.log(csv);
}

let clusters = {
    counts: {},
    maxBin: 0,
    bins: {}
};

fs.createReadStream(INPUT)
    .pipe(es.split())
    .pipe(es.mapSync(parseLine)
    .on('error', function(err){
        console.log('!!!', err);
    })
    .on('end', function(){
        writeCsv();
    }));

