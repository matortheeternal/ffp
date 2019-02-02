const fs = require('fs');

class SyncReadableStream {
    constructor(filePath) {
        this._buffer = fs.readFileSync(filePath);
        this._pos = 0;
    }

    read(numBytes) {
        if (this._pos + numBytes > this._buffer.length)
            throw new Error('The stream has ended.');
        let buf = this._buffer.slice(this._pos, this._pos + numBytes);
        this._pos += numBytes;
        return buf;
    }

    getRemainingBytes() {
        return this._buffer.length - this._pos;
    }
}

module.exports = SyncReadableStream;