let ffp = require('../index'),
    path = require('path'),
    fs = require('fs');

let bytesPath = path.resolve(__dirname, './fixtures/bytes');

describe('Parsing Bytes', () => {
    let stream, store = {};

    beforeAll(done => {
        ffp.addDataType('bytes', {
            read: stream => stream.read(4)
        });

        stream = fs.createReadStream(bytesPath);
        stream.on('readable', done);
    });

    it('should read the bytes into a buffer', () => {
        ffp.parseEntity(stream, {
            type: 'bytes',
            storageKey: 'bytes'
        }, store);
        expect(store.bytes).toBeDefined();
        expect(store.bytes.constructor).toBe(Buffer);
        expect(store.bytes.length).toBe(4);
        expect(store.bytes.readUInt32BE()).toBe(0x12345678);
    });
});