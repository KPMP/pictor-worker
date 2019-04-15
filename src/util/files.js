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
        log.debug('... ' + streamName, inPath);

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
                    log.debug('+++ ' + streamName + ' done');
                    resolve();
                }));
    });
}

getStreamWriter = (outPath, writeFunc, appendMode = false) => {
    let isNew = false;

    if(!env.WRITE_FILES) {
        log.info('!!! Skipping file write; WRITE_FILES = false');
        return;
    }

    if(!fileUtilState.outStreams[outPath]) {
        const outPathElements = outPath.split(env.PATH_DELIM);
        shell.mkdir('-p', outPathElements.slice(0, outPathElements.length - 1).join(env.PATH_DELIM));

        if(fs.existsSync(outPath) && !appendMode) {
            log.debug("--- Deleting existing output file: " + outPath);
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

module.exports = {streamRead, getStreamWriter};
