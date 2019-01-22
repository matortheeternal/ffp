let ffp = require('../index'),
    {testOutput} = require('./testHelpers'),
    path = require('path'),
    fs = require('fs');

let arraysPath = path.resolve(__dirname, './output/arrays');

describe('Writing Arrays', () => {
    let stream, data = {
        numbers: [10, 100, 1000],
        stringCount: 6,
        strings: ['this', 'is', 'an', 'array', 'of', 'strings']
    };

    beforeAll(() => {
        ffp.setEndianness('BE');

        ffp.addDataType('pascal string', {
            write: (stream, entity, data) => {
                let buf = Buffer.alloc(2 + data.length);
                buf.writeUInt16BE(data.length);
                buf.write(data, 2, data.length, 'ascii');
                stream.write(buf);
                return buf;
            }
        });
    });

    beforeEach(() => {
        stream = fs.createWriteStream(arraysPath);
    });

    let readNumberArray = function(buf) {
        let numbers = [];
        for (let i = 2; i < buf.length; i += 2)
            numbers.push(buf.slice(i, i + 2).readUInt16BE());
        return numbers;
    };

    let readStringArray = function(buf, start) {
        let strings = [],
            i = start;
        while (i < buf.length) {
            let len = buf.readUInt16BE(i);
            i += 2;
            strings.push(buf.slice(i, i + len).toString('ascii'));
            i += len;
        }
        return strings;
    };

    it('should work with inline count', done => {
        ffp.writeEntity(stream, {
            type: 'array',
            count: {type: 'uint16'},
            entry: {type: 'uint16'},
            storageKey: 'numbers'
        }, data);

        testOutput(stream, output => {
            expect(Buffer.isBuffer(output)).toBe(true);
            expect(output.length).toBe(8);
            expect(readNumberArray(output)).toEqual(data.numbers);
            done();
        });
    });

    it('should work with countKey', done => {
        ffp.writeEntity(stream, {
            type: 'uint16',
            storageKey: 'stringCount'
        }, data);

        ffp.writeEntity(stream, {
            type: 'array',
            countKey: 'stringCount',
            entry: {type: 'pascal string'},
            storageKey: 'strings'
        }, data);

        testOutput(stream, output => {
            expect(Buffer.isBuffer(output)).toBe(true);
            expect(output.length).toBe(36);
            expect(output.readUInt16BE()).toBe(6);
            expect(readStringArray(output, 2)).toEqual(data.strings);
            done();
        });
    });
});