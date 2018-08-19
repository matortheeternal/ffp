const Fiber = require('fibers'),
      fs = require('fs');

class SyncWriteableStream {
    constructor(filePath) {
        this._stream = fs.createWriteStream(filePath);
        this.ended = false;
        this._pos = 0;
    }

    getReady() {
        let fiber = Fiber.current;
        this._stream.once('drain', () => {
            this.ready = true;
            fiber.run();
        });
        Fiber.yield();
    }

    onReady(callback) {
        this.ready = true;
        Fiber(callback).run();
    }

    onFinish(callback) {
        this._stream.once('finish', callback);
    }

    write(buf) {
        if (this.ended) throw new Error('The stream has ended.');
        let ok = this._stream.write(buf);
        if (!ok) this.getReady();
        if (ok) {
            this._pos += buf.length;
            return buf;
        }
    }

    end() {
        this.ended = true;
        this._stream.end();
    }
}

module.exports = SyncWriteableStream;