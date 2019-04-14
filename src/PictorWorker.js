const fs = require('graceful-fs');
const es = require('event-stream');
const _ = require('lodash');
const shell = require('shelljs');

const PATH_DELIM = "/";
const ROW_DELIM = "\n";
const LEGEND_FILENAME = "Legend";
const LEGEND_HEADER = "datasetcluster,cellct,mastercluster";
const VIOLIN_PLOT_FILENAME = "violinPlot";
const VIOLIN_PLOT_HEADER = "cellname,gene,cluster,readcount";

const DEBUGGING = true;
const WRITE_FILES = true;
const WRITE_GENE_FILES = true;

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
        this.result = {
            startTime: Date.now(),
            barcodeMap: {},
            clusterLegend: {},
            readCountHeader: [],
            barcodeCt: 0,
            readCountRowCt: 0
        };

        return this;
    }

    parseBarcodeToCellMap(inPath, inDelim) {
        const worker = PictorWorker.getInstance();
        return worker.streamRead("parseBarcodeToCellMap", inPath, (line) => {
            const row = line.split(inDelim);

            if (row && row.length === 2) {
                worker.result.barcodeMap[row[0]] = row[1];

                worker.result.clusterLegend[row[1]] =
                    worker.result.clusterLegend[row[1]] ||
                    0;

                worker.result.clusterLegend[row[1]]++;
                worker.result.barcodeCt++;
            }
        });
    }

    processReadCountTable(datasetName, inPath, inDelim, outPath, outDelim) {
        const worker = PictorWorker.getInstance();
        return worker.streamRead("processReadCountTable", inPath, (line) => {
            const inputCols = line.split(inDelim), // this will be factors of 10^4, 10^5 long
                outputRows = [],
                sanitize = (str) => str ? str.replace(/["']/g, '') : false;
            let gene = null;

            //worker.debug("+++ " + inputCols.length + " columns found");

            if(!worker.result.readCountHeader.length) {
                worker.result.readCountHeader = inputCols;
                //worker.debug("+++ Header found: " + JSON.stringify(inputCols));
                return;
            }

            _.forEach(inputCols, (col, i) => {
                if(i === 0) {
                    gene = sanitize(col);
                    worker.debug("... Processing gene " + gene);
                    return;
                }

                if(!gene || !sanitize(worker.result.readCountHeader[i])) {
                    return;
                }

                let row = [
                    sanitize(worker.result.readCountHeader[i]), //cellname
                    gene, //gene
                    sanitize(worker.result.barcodeMap[worker.result.readCountHeader[i]]), // cluster
                    parseFloat(sanitize(col)) //readcount
                ];

                //worker.debug(row);
                outputRows.push(row);
            });

            if(gene && gene.length > 0) {
                worker.writeToGeneDatasetFile(
                    outputRows,
                    outPath,
                    gene,
                    datasetName,
                    VIOLIN_PLOT_FILENAME,
                    outDelim,
                    VIOLIN_PLOT_HEADER
                );

                worker.result.readCountRowCt++;
            }
        });
    }

    writeLegend(datasetName, outPath, outDelim) {
        const worker = PictorWorker.getInstance();
        return new Promise((resolve, reject) => {
            worker.debug('... writeLegend');

            if(!WRITE_FILES) {
                worker.log('!!! Skipping file write; WRITE_FILES = false');
                resolve();
            }

            shell.mkdir('-p', outPath);
            const outputPathElements = [outPath, datasetName + "_" + LEGEND_FILENAME],
                fullOuthPath = outputPathElements.join(PATH_DELIM) + (outDelim === "," ? ".csv" : ".txt");

            if(fs.existsSync(fullOuthPath)) {
                worker.debug("--- Deleting existing output file: " + fullOuthPath);
                shell.rm('-f', fullOuthPath);
            }

            const os = fs.createWriteStream(fullOuthPath, {flags:'a'});
            os.write(LEGEND_HEADER + ROW_DELIM);

            //TODO sort the legend by cluster before writing out

            _.forEach(Object.keys(worker.result.clusterLegend), (cluster) => {
                //We write a file with only this data; the master column must be added manually post-hoc
                os.write(cluster + outDelim + worker.result.clusterLegend[cluster] + outDelim + ROW_DELIM);
            });

            resolve();
        });
    }

    logResult() {
        const worker = PictorWorker.getInstance();
        return new Promise((resolve, reject) => {
            worker.debug('... logResult');
            worker.log('Barcode ct: ' + worker.result.barcodeCt);
            worker.log('Read count row ct: ' + worker.result.readCountRowCt);
            worker.log('Runtime: ' + ((Date.now() - this.result.startTime) / 1000) + "s");
            resolve();
        });
    }

    writeToGeneDatasetFile(rows, basePath, geneName, datasetName, fileName, outDelim, header) {
        const worker = PictorWorker.getInstance();
        const outPath = worker.getOutPath(worker, basePath, geneName, datasetName, fileName, outDelim);

        if(!WRITE_GENE_FILES) {
            worker.log('!!! Skipping file write; WRITE_GENE_FILES = false');
            return;
        }

        worker.os = worker.os || {};
        worker.os[geneName] = worker.os[geneName] || {};
        worker.os[geneName][datasetName] = worker.os[geneName][datasetName] || {};

        if(!worker.os[geneName][datasetName][fileName]) {
            const outPathElements = outPath.split(PATH_DELIM);
            shell.mkdir('-p', outPathElements.slice(0, outPathElements.length - 1).join(PATH_DELIM));

            if(fs.existsSync(outPath)) {
                worker.debug("--- Deleting existing output file: " + outPath);
                shell.rm('-f', outPath);
            }

            worker.os[geneName][datasetName][fileName] = fs.createWriteStream(outPath, {flags:'a'});
            worker.os[geneName][datasetName][fileName].write(header + ROW_DELIM);
        }

        worker.os[geneName][datasetName][fileName].write(
            rows.map((row) => row.join(outDelim))
                .join(ROW_DELIM) + ROW_DELIM
        );
    }

    getOutPath(worker, basePath, geneName, datasetName, fileSuffix, outDelim) {
        let fileName = datasetName + "_" + fileSuffix + (outDelim === "," ? ".csv" : ".txt"),
            pathElements = [basePath, geneName[0], geneName, fileName],
            output = pathElements.join(PATH_DELIM),
            test = [geneName, fileName].join('').match(/[^-_.A-Za-z0-9]/g);

        if(test && test.length) {
            worker.log('!!! Suspicious path detected: ' + output);
        }

        return output;
    }

    streamRead(streamName, inPath, streamFunc) {
        const worker = PictorWorker.getInstance();
        return new Promise((resolve, reject) => {
            worker.debug('... ' + streamName, inPath);

            if(!fs.existsSync(inPath)) {
                reject("!!! streamRead error: No file found at ", inPath);
                return;
            }

            let s = fs.createReadStream(inPath)
                .pipe(es.split())
                .pipe(es.mapSync((line) => {
                    streamFunc(line);
                })
                .on('error', function(err){
                    reject(err);
                })
                .on('end', function(){
                    worker.debug('+++ ' + streamName + ' done');
                    resolve();
                }));
        });
    }

    log(msg) {
        console.log(
            ((Date.now() - this.result.startTime) / 1000) +
            ": ", msg
        );
    }

    debug(msg) {
        DEBUGGING && console.log(
            ((Date.now() - this.result.startTime) / 1000) +
            ": ", msg
        );
    }
}

module.exports = { PictorWorker };