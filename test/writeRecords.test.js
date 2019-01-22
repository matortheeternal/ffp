let ffp = require('../index'),
    {testOutput} = require('./testHelpers'),
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

        ffp.addDataFormat('Person', [{
            type: 'pascal string',
            storageKey: 'name'
        }, {
            type: 'uint8',
            storageKey: 'gender',
            transform: {
                read: value => value ? 'male' : 'female',
                write: data => data === 'male' ? 1 : 0
            }
        }, {
            type: 'uint16',
            storageKey: 'age'
        }]);
    });

    beforeEach(() => {
        fs.unlinkSync(recordsPath);
        stream = fs.createWriteStream(recordsPath);
    });

    let readPeople = function(buf) {
        let people = [],
            i = 2;
        while (i < buf.length) {
            let len = buf.slice(i, i += 2).readUInt16BE();
            let name = buf.slice(i, i += len).toString('ascii');
            let gender = buf.slice(i, i += 1).readUInt8();
            gender = gender === 1 ? 'male' : 'female';
            let age = buf.slice(i, i += 2).readUInt16BE();
            people.push({ name, gender, age });
        }
        return people;
    };

    it('should write arrays of records', done => {
        ffp.writeEntity(stream, {
            type: 'array',
            count: {type: 'uint16'},
            entry: {type: 'record', format: 'Person'},
            storageKey: 'people'
        }, data);

        testOutput(stream, output => {
            expect(Buffer.isBuffer(output)).toBe(true);
            expect(output.length).toBe(42);
            expect(readPeople(output)).toEqual(data.people);
            done();
        });
    });
});