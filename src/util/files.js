const es = require('event-stream');
const fs = require('graceful-fs');
const log = require('./log');
const env = require('./env');
const shell = require('shelljs');

const fileUtilState = {
    inStreams: {},
    outStreams: {}
};

streamRead = (streamName, inPath, readFunc) => {
    return new Promise((resolve, reject) => {
        env.DEBUGGING && console.log('... ' + streamName, inPath);

        if(!fs.existsSync(inPath)) {
            reject("!!! streamRead error: No file found at ", inPath);
            return;
        }

        let s = fs.createReadStream(inPath)
            .pipe(es.split())
            .pipe(es.mapSync(readFunc)
                .on('error', function(err){
                    reject(err);
                })
                .on('end', function(){
                    env.DEBUGGING && console.log('+++ ' + streamName + ' done');
                    resolve();
                }));
    });
}

getStreamWriter = (outPath, writeFunc, appendMode = false) => {
    let isNew = false;

    if(!env.WRITE_FILES) {
        console.log('!!! getStreamWriter: Skipping file write; WRITE_FILES = false');
        return;
    }

    if(!fileUtilState.outStreams[outPath]) {
        const outPathElements = outPath.split(env.PATH_DELIM);
        shell.mkdir('-p', outPathElements.slice(0, outPathElements.length - 1).join(env.PATH_DELIM));

        if(fs.existsSync(outPath) && !appendMode) {
            env.DEBUGGING && console.log("--- Deleting existing output file: " + outPath);
            shell.rm('-f', outPath);
            isNew = true;
        }

        else if(!fs.existsSync(outPath)) {
            isNew = true;
        }

        fileUtilState.outStreams[outPath] = fs.createWriteStream(outPath, {flags:'a'});
    }

    writeFunc(fileUtilState.outStreams[outPath], isNew);
}

getPath = (basePath, geneName, datasetName, fileSuffix) => {
    let fileName = datasetName + "_" + fileSuffix + (env.OUT_DELIM === "," ? ".csv" : ".txt"),
        pathElements = [basePath, geneName[0], geneName, fileName],
        output = pathElements.join(env.PATH_DELIM),
        test = [geneName, fileName].join('').match(/[^-_.A-Za-z0-9]/g);

    if(test && test.length) {
        console.log('!!! Suspicious path detected: ' + output);
    }

    return output;
}

sanitize = (str) => {
    return str ? str.replace(/["']/g, '') : false;
}

module.exports = {streamRead, getStreamWriter, getPath, sanitize};
