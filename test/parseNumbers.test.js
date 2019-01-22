let ffp = require('../index'),
    path = require('path'),
    fs = require('fs');

let numbersPath = path.resolve(__dirname, './fixtures/numbers');

['BE', 'LE'].forEach(endianness => {
    describe(`Parsing Numbers (${endianness})`, () => {
        let stream, store = {};

        beforeAll(done => {
            ffp.setEndianness(endianness);
            stream = fs.createReadStream(numbersPath + endianness);
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

        it('should read int16 values', () => {
            ffp.parseEntity(stream, {
                type: 'int16',
                storageKey: 'int16'
            }, store);
            expect(store.int16).toBeDefined();
            expect(store.int16).toBe(-32768);
        });

        it('should read int32 values', () => {
            ffp.parseEntity(stream, {
                type: 'int32',
                storageKey: 'int32'
            }, store);
            expect(store.int32).toBeDefined();
            expect(store.int32).toBe(-2147483648);
        });

        it('should read float values', () => {
            ffp.parseEntity(stream, {
                type: 'float',
                storageKey: 'float'
            }, store);
            expect(store.float).toBeDefined();
            expect(store.float).toBe(1.2345600128173828);
        });
    });
});