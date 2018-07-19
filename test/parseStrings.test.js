let {parseEntity, addDataType, getDataType, readUntil} = require('../index'),
    path = require('path'),
    fs = require('fs');

let stringsPath = path.resolve(__dirname, './fixtures/strings');

describe('Parsing Strings', () => {
    let stream, store = {};

    beforeAll(done => {
        addDataType('uint16', {
            read: stream => stream.read(2).readUInt16BE()
        });

        addDataType('utf8 string', {
            read: stream => {
                let buf = readUntil(stream, 0x00);
                return buf.toString('utf8');
            }
        });

        addDataType('pascal string', {
            read: stream => {
                let uint16 = getDataType('uint16'),
                    len = uint16.read(stream);
                return stream.read(len).toString('ascii');
            }
        });

        addDataType('ucs2 string', {
            read: stream => {
                let buf = readUntil(stream, 0x00, 2, 'readUInt16BE');
                return buf.toString('ucs2');
            }
        });

        stream = fs.createReadStream(stringsPath);
        stream.on('readable', done);
    });

    it('should parse utf8 strings', () => {
        parseEntity(stream, {
            type: 'utf8 string',
            storageKey: 'str'
        }, store);
        expect(store.str).toBeDefined();
        expect(store.str.constructor).toBe(String);
        expect(store.str.length).toBe(8);
        expect(store.str).toBe('utf-8 很棒');
    });

    it('should parse pascal strings', () => {
        parseEntity(stream, {
            type: 'pascal string',
            storageKey: 'pstr'
        }, store);
        expect(store.pstr).toBeDefined();
        expect(store.pstr.constructor).toBe(String);
        expect(store.pstr.length).toBe(12);
        expect(store.pstr).toBe('pascal-style');
    });

    it('should parse ucs2 strings', () => {
        parseEntity(stream, {
            type: 'ucs2 string',
            storageKey: 'wstr'
        }, store);
        expect(store.wstr).toBeDefined();
        expect(store.wstr.constructor).toBe(String);
        expect(store.wstr.length).toBe(12);
        expect(store.wstr).toBe('ucs2-is-wide');
    });
});