let ffp = require('../index'),
    path = require('path'),
    fs = require('fs');

let numbersPath = path.resolve(__dirname, './fixtures/numbers');

describe('Parsing Numbers', () => {
    let stream, store = {};

    beforeAll(done => {
        ffp.setEndianness('BE');
        stream = fs.createReadStream(numbersPath);
        stream.on('readable', done);
    });

    it('should read uint8 values', () => {
        ffp.parseEntity(stream, {
            type: 'uint8',
            storageKey: 'uint8'
        }, store);
        expect(store.uint8).toBeDefined();
        expect(store.uint8).toBe(0xFF);
    });

    it('should read uint16 values', () => {
        ffp.parseEntity(stream, {
            type: 'uint16',
            storageKey: 'uint16'
        }, store);
        expect(store.uint16).toBeDefined();
        expect(store.uint16).toBe(0x1001);
    });

    it('should read uint32 values', () => {
        ffp.parseEntity(stream, {
            type: 'uint32',
            storageKey: 'uint32'
        }, store);
        expect(store.uint32).toBeDefined();
        expect(store.uint32).toBe(0x12345678);
    });

    it('should read int32 values', () => {
        ffp.parseEntity(stream, {
            type: 'int32',
            storageKey: 'int32'
        }, store);
        expect(store.int32).toBeDefined();
        expect(store.int32).toBe(-2147483648);
    });
});