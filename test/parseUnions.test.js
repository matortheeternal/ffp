let {parseEntity, addDataType, getDataType, addDataFormat} = require('../index'),
    path = require('path'),
    fs = require('fs');

let unionsPath = path.resolve(__dirname, './fixtures/unions');

const VARTYPE_UINT16 = 0,
      VARTYPE_INT32 = 1,
      VARTYPE_STRING = 2;

describe('Parsing Unions', () => {
    let stream, store = {};

    beforeAll(done => {
        addDataType('uint16', {
            read: stream => stream.read(2).readUInt16BE()
        });

        addDataType('int32', {
            read: stream => stream.read(4).readInt32BE()
        });

        addDataType('pascal string', {
            read: stream => {
                let uint16 = getDataType('uint16'),
                    len = uint16.read(stream);
                return stream.read(len).toString('ascii');
            }
        });

        addDataFormat('Variable', [{
            type: 'pascal string',
            storageKey: 'name'
        }, {
            type: 'union',
            storageKey: 'data',
            decide: (stream, entity, store) => {
                let uint8 = getDataType('uint8');
                store.type = uint8.read(stream, entity, store);
                switch(store.type) {
                    case VARTYPE_UINT16:
                        let uint16 = getDataType('uint16');
                        return uint16.read(stream, entity, store);
                    case VARTYPE_INT32:
                        let int32 = getDataType('int32');
                        return int32.read(stream, entity, store);
                    case VARTYPE_STRING:
                        let pstr = getDataType('pascal string');
                        return pstr.read(stream, entity, store);
                }
            }
        }]);

        stream = fs.createReadStream(unionsPath);
        stream.on('readable', done);
    });

    it('should parse unions', () => {
        parseEntity(stream, {
            type: 'array',
            count: {type: 'uint16'},
            entry: {type: 'record', format: 'Variable'},
            storageKey: 'variables'
        }, store);
        expect(store.variables).toBeDefined();
        expect(store.variables.constructor).toBe(Array);
        expect(store.variables.length).toBe(3);
        expect(store.variables).toEqual([{
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
            data: 'Hello World!'
        }]);
    });
});