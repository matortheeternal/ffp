const Fiber = require('fibers'),
      fs = require('fs');

class SyncStream {
    constructor(filePath) {
        this._stream = fs.createReadStream(filePath);
    }

    getReady() {
        let fiber = Fiber.current;
        this._stream.once('readable', () => {
            this.ready = true;
            fiber.run();
        });
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
        if (buf) return buf;
        // buffer isn't ready, let's wait
        this.ready = false;
        return this.read(numBytes);
    }
}

module.exports = SyncStream;