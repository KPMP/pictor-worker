const env = require('./env');
const files = require('./files');

const logUtilState = {
    startTime: Date.now()
};

const info = (msg) => {
    const output = ((Date.now() - logUtilState.startTime) / 1000) +
        ": " + msg;

    console.log(output);
    if(env.HARD_LOGGING) hardLog(msg);
}

const debug = (msg) => {
    env.DEBUGGING && info(msg);
}

const hardLog = (msg) => {
    files.getStreamWriter(env.LOG_DIR + env.PATH_DELIM + "log.txt", (os) => {
        os.write(msg + env.ROW_DELIM);
    }, true);
}

module.exports = {info, debug, logUtilState};