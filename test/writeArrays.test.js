let ffp = require('../index'),
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

        // using special array type here so we can test the
        // output buffer without having to read the file
        ffp.addDataType('test array', {
            write: (stream, entity, data) => {
                let buffers = [],
                    countBuf = ffp.writeArrayCount(stream, entity, data),
                    entryType = ffp.getDataType(entity.entry.type);
                if (countBuf) buffers.push(countBuf);
                if (!entryType)
                    throw new Error(`Data type ${entity.entry.type} not found.`);
                for (let i = 0; i < data.length; i++)
                    buffers.push(entryType.write(stream, entity.entry, data[i]));
                return Buffer.concat(buffers);
            }
        });

        ffp.addDataType('pascal string', {
            write: (stream, entity, data) => {
                let buf = Buffer.alloc(2 + data.length);
                buf.writeUInt16BE(data.length);
                buf.write(data, 2, data.length, 'ascii');
                stream.write(buf);
                return buf;
            }
        });

        stream = fs.createWriteStream(arraysPath);
    });

    let readNumberArray = function(buf) {
        let numbers = [];
        for (let i = 2; i < buf.length; i += 2)
            numbers.push(buf.slice(i, i + 2).readUInt16BE());
        return numbers;
    };

    it('should work with inline count', () => {
        let output = ffp.writeEntity(stream, {
            type: 'test array',
            count: {type: 'uint16'},
            entry: {type: 'uint16'},
            storageKey: 'numbers'
        }, data);
        expect(output).toBeDefined();
        expect(Buffer.isBuffer(output)).toBe(true);
        expect(output.length).toBe(8);
        expect(readNumberArray(output)).toEqual(data.numbers);
    });

    let readStringArray = function(buf) {
        let strings = [],
            i = 0;
        while (i < buf.length) {
            let len = buf.readUInt16BE(i);
            i += 2;
            strings.push(buf.slice(i, i + len).toString('ascii'));
            i += len;
        }
        return strings;
    };

    it('should work with countKey', () => {
        let output = ffp.writeEntity(stream, {
            type: 'uint16',
            storageKey: 'stringCount'
        }, data);
        expect(output.readUInt16BE()).toBe(6);

        output = ffp.writeEntity(stream, {
            type: 'test array',
            countKey: 'stringCount',
            entry: {type: 'pascal string'},
            storageKey: 'strings'
        }, data);
        expect(output).toBeDefined();
        expect(Buffer.isBuffer(output)).toBe(true);
        expect(output.length).toBe(34);
        expect(readStringArray(output)).toEqual(data.strings);
    });
});