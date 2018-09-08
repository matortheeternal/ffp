const fs = require('fs');

class SyncWriteableStream {
    constructor(filePath) {
        this._filePath = filePath;
        this._buffer = Buffer.alloc(0);
    }

    write(buf) {
        this._buffer = Buffer.concat([this._buffer, buf]);
    }

    end() {
        fs.writeFileSync(this._filePath, this._buffer);
    }
}

module.exports = SyncWriteableStream;