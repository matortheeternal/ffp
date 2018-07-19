let {parseEntity, addDataType, getDataType} = require('../index'),
    path = require('path'),
    fs = require('fs');

let arraysPath = path.resolve(__dirname, './fixtures/arrays');

describe('Parsing Arrays', () => {
    let stream, store = {};

    beforeAll(done => {
        addDataType('uint16', {
            read: stream => stream.read(2).readUInt16BE()
        });

        addDataType('pascal string', {
            read: stream => {
                let uint16 = getDataType('uint16'),
                    len = uint16.read(stream);
                return stream.read(len).toString('ascii');
            }
        });

        stream = fs.createReadStream(arraysPath);
        stream.on('readable', done);
    });

    it('should parse arrays of numbers', () => {
        parseEntity(stream, {
            type: 'array',
            count: {type: 'uint16'},
            entry: {type: 'uint16'},
            storageKey: 'numbers'
        }, store);
        expect(store.numbers).toBeDefined();
        expect(store.numbers.constructor).toBe(Array);
        expect(store.numbers.length).toBe(3);
        expect(store.numbers).toEqual([10, 100, 1000]);
    });

    it('should parse arrays of pascal strings', () => {
        parseEntity(stream, {
            type: 'array',
            count: {type: 'uint16'},
            entry: {type: 'pascal string'},
            storageKey: 'strings'
        }, store);
        expect(store.strings).toBeDefined();
        expect(store.strings.constructor).toBe(Array);
        expect(store.strings.length).toBe(6);
        expect(store.strings).toEqual(['this', 'is', 'an', 'array', 'of', 'strings']);
    });
});