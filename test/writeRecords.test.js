let {writeEntity, writeArrayCount, addDataType,
        getDataType, addDataFormat, getDataFormat} = require('../index'),
    path = require('path'),
    fs = require('fs');

let recordsPath = path.resolve(__dirname, './output/records');

describe('Writing Records', () => {
    let stream, data = {
        people: [{
            name: 'Jane Doe',
            gender: 'female',
            age: 47
        }, {
            name: 'Jimmy',
            gender: 'male',
            age: 13
        }, {
            name: 'Ada Lovelace',
            gender: 'female',
            age: 202
        }]
    };

    beforeAll(() => {
        // using special uint8 type here so we can test the
        // output buffer without having to read the file
        addDataType('test uint8', {
            write: (stream, entity, data) => {
                let buf = Buffer.alloc(1);
                buf.writeUInt8(data);
                stream.write(buf);
                return buf;
            }
        });

        addDataType('uint16', {
            write: (stream, entity, data) => {
                let buf = Buffer.alloc(2);
                buf.writeUInt16BE(data);
                stream.write(buf);
                return buf;
            }
        });

        addDataType('pascal string', {
            write: (stream, entity, data) => {
                let buf = Buffer.alloc(2 + data.length);
                buf.writeUInt16BE(data.length);
                buf.write(data, 2, data.length, 'ascii');
                stream.write(buf);
                return buf;
            }
        });

        // using special array type here so we can test the
        // output buffer without having to read the file
        addDataType('test array', {
            write: (stream, entity, data) => {
                let buffers = [],
                    countBuf = writeArrayCount(stream, entity, data),
                    entryType = getDataType(entity.entry.type);
                if (countBuf) buffers.push(countBuf);
                if (!entryType)
                    throw new Error(`Data type ${entity.entry.type} not found.`);
                for (let i = 0; i < data.length; i++)
                    buffers.push(entryType.write(stream, entity.entry, data[i]));
                return Buffer.concat(buffers);
            }
        });

        let writeSchema = function(stream, schema, data) {
            let buffers = [];
            if (schema.constructor === Array) {
                schema.forEach(entity => {
                    buffers.push(writeEntity(stream, entity, data));
                });
            } else {
                buffers.push(writeEntity(stream, schema, data));
            }
            return Buffer.concat(buffers);
        };

        // using special record type here so we can test the
        // output buffer without having to read the file
        addDataType('test record', {
            write: (stream, entity, data) => {
                let format = getDataFormat(entity.format);
                if (!format)
                    throw new Error(`Data format ${entity.format} not found.`);
                return writeSchema(stream, format, data);
            }
        });

        addDataFormat('Person', [{
            type: 'pascal string',
            storageKey: 'name'
        }, {
            type: 'test uint8',
            storageKey: 'gender',
            transform: {
                read: value => value ? 'male' : 'female',
                write: data => data === 'male' ? 1 : 0
            }
        }, {
            type: 'uint16',
            storageKey: 'age'
        }]);

        stream = fs.createWriteStream(recordsPath);
    });

    let readPeople = function(buf) {
        let people = [],
            i = 2;
        while (i < buf.length) {
            let len = buf.slice(i, i + 2).readUInt16BE();
            i += 2;
            let name = buf.slice(i, i + len).toString('ascii');
            i += len;
            let gender = buf.slice(i, i + 1).readUInt8();
            gender = gender === 1 ? 'male' : 'female';
            i += 1;
            let age = buf.slice(i, i + 2).readUInt16BE();
            i += 2;
            people.push({ name, gender, age });
        }
        return people;
    };

    it('should write arrays of records', () => {
        let output = writeEntity(stream, {
            type: 'test array',
            count: {type: 'uint16'},
            entry: {type: 'test record', format: 'Person'},
            storageKey: 'people'
        }, data);
        expect(output).toBeDefined();
        expect(Buffer.isBuffer(output)).toBe(true);
        expect(output.length).toBe(42);
        expect(readPeople(output)).toEqual(data.people);
    });
});