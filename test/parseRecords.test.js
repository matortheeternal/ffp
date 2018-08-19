let {parseEntity, addDataType, getDataType, addDataFormat} = require('../index'),
    path = require('path'),
    fs = require('fs');

let recordsPath = path.resolve(__dirname, './fixtures/records');

describe('Parsing Records', () => {
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

        addDataFormat('Person', [{
            type: 'pascal string',
            storageKey: 'name',
            callback: value => console.log(`Found ${value}`)
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

        stream = fs.createReadStream(recordsPath);
        stream.on('readable', done);
    });

    it('should parse arrays of records', () => {
        parseEntity(stream, {
            type: 'array',
            count: {type: 'uint16'},
            entry: {type: 'record', format: 'Person'},
            storageKey: 'people'
        }, store);
        expect(store.people).toBeDefined();
        expect(store.people.constructor).toBe(Array);
        expect(store.people.length).toBe(3);
        expect(store.people).toEqual([{
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
        }]);
    });
});