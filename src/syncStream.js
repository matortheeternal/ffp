const Fiber = require('fibers'),
      fs = require('fs');

class SyncStream {
    constructor(filePath) {
        this._stream = fs.createReadStream(filePath);
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
        if (!this.ready) this.getReady();
        let buf = this._stream.read(numBytes);
        if (buf || this.ended) return buf;
        // buffer isn't ready, let's wait
        this.ready = false;
        return this.read(numBytes);
    }

    get ended() {
        return this._stream._readableState.ended;
    }
}

module.exports = SyncStream;