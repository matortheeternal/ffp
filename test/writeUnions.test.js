let ffp = require('../index'),
    {testOutput} = require('./testHelpers'),
    path = require('path'),
    fs = require('fs');

let unionsPath = path.resolve(__dirname, './output/unions');

describe('Writing Unions', () => {
    let stream, errStream, data = {
        variables: [{
            name: 'num_things',
            type: 0,
            data: 1024
        }, {
            name: 'offset',
            type: 1,
            data: -123
        }, {
            name: 'str',
            type: 2,
            data: 'Hello world!'
        }]
    }, errData = {
        variables: [{
            name: 'float',
            type: 3,
            data: 1.23456
        }]
    };

    beforeAll(() => {
        ffp.setEndianness('BE');

        ffp.addDataType('pascal string', {
            write: (stream, entity, data) => {
                let buf = Buffer.alloc(2 + data.length);
                buf.writeUInt16BE(data.length);
                buf.write(data, 2, data.length, 'ascii');
                stream.write(buf);
            }
        });

        ffp.addDataFormat('Variable', [{
            type: 'pascal string',
            storageKey: 'name'
        }, {
            type: 'uint8',
            storageKey: 'type'
        }, {
            type: 'union',
            storageKey: 'data',
            switchKey: 'type',
            cases: {
                0: {type: 'uint16'},
                1: {type: 'int32'},
                2: {type: 'pascal string'}
            }
        }]);

        stream = fs.createWriteStream(unionsPath);
        errStream = fs.createWriteStream(unionsPath + 'ERR');
    });

    afterAll(done => {
        errStream.end();
        errStream.on('finish', () => {
            fs.unlinkSync(unionsPath + 'ERR');
            done();
        });
    });

    let readVariableData = function(type, buf, i) {
        if (type === 0)
            return [buf.slice(i, i + 2).readUInt16BE(), i + 2];
        if (type === 1)
            return [buf.slice(i, i + 4).readInt32BE(), i + 4];
        let len = buf.slice(i, i += 2).readUInt16BE();
        return [buf.slice(i, i + len).toString('ascii'), i + len];
    };

    let readVariables = function(buf) {
        let variables = [],
            i = 2;
        while (i < buf.length) {
            let data;
            let len = buf.slice(i, i += 2).readUInt16BE();
            let name = buf.slice(i, i += len).toString('ascii');
            let type = buf.slice(i, i += 1).readUInt8();
            [data, i] = readVariableData(type, buf, i);
            variables.push({ name, type, data });
        }
        return variables;
    };

    it('should throw an error if union switch value is unknown', () => {
        expect(() => {
            ffp.writeEntity(errStream, {
                type: 'array',
                count: {type: 'uint16'},
                entry: {type: 'record', format: 'Variable'},
                storageKey: 'variables'
            }, errData);
        }).toThrowError('Unknown union switch value 3.');
    });

    it('should write arrays of unions', done => {
        ffp.writeEntity(stream, {
            type: 'array',
            count: {type: 'uint16'},
            entry: {type: 'record', format: 'Variable'},
            storageKey: 'variables'
        }, data);

        testOutput(stream, output => {
            expect(Buffer.isBuffer(output)).toBe(true);
            expect(output.length).toBe(50);
            expect(readVariables(output)).toEqual(data.variables);
            done();
        });
    });
});