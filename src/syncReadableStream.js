const Fiber = require('fibers'),
      fs = require('fs');

class SyncReadableStream {
    constructor(filePath) {
        this._stream = fs.createReadStream(filePath);
        this._fileSize = fs.statSync(filePath).size;
        this._pos = 0;
    }

    getReady() {
        let fiber = Fiber.current;
        let ready = () => {
            this._stream.removeListener('end', ready);
            this.ready = true;
            fiber.run();
        };
        this._stream.on('end', ready);
        this._stream.once('readable', ready);
        Fiber.yield();
    }

    onReady(callback) {
        this._stream.once('readable', () => {
            this.ready = true;
            Fiber(callback).run();
        });
    }

    read(numBytes) {
        if (this.ended) throw new Error('The stream has ended.');
        if (!this.ready) this.getReady();
        let buf = this._stream.read(numBytes);
        if (buf) {
            this._pos += numBytes;
            return buf;
        }
        // buffer isn't ready, let's wait
        this.ready = false;
        return this.read(numBytes);
    }

    getRemainingBytes() {
        return this._fileSize - this._stream.bytesRead;
    }

    get ended() {
        return this._stream._readableState.ended;
    }
}

module.exports = SyncReadableStream;