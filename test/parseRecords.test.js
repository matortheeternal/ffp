let ffp = require('../index'),
    path = require('path'),
    fs = require('fs');

let recordsPath = path.resolve(__dirname, './fixtures/records');

describe('Parsing Records', () => {
    let stream, store = {};

    beforeAll(done => {
        ffp.setEndianness('BE');

        ffp.addDataType('pascal string', {
            read: stream => {
                let len = ffp.uint16.read(stream);
                return stream.read(len).toString('ascii');
            }
        });

        ffp.addDataFormat('Person', [{
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
        ffp.parseEntity(stream, {
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