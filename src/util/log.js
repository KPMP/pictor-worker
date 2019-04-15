const env = require('./env');

const logUtilState = {
    startTime: Date.now()
};

const info = (msg) => {
    console.log(
        ((Date.now() - logUtilState.startTime) / 1000) +
        ": ", msg
    );
}

const debug = (msg) => {
    env.DEBUGGING && console.log(
        ((Date.now() - logUtilState.startTime) / 1000) +
        ": ", msg
    );
}

module.exports = {info, debug, logUtilState};