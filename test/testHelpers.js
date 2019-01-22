let fs = require('fs');

module.exports = {
    testOutput: function(stream, callback) {
        stream.end();
        stream.on('finish', () => {
            let buf = fs.readFileSync(stream.path);
            callback(buf);
        });
    }
};