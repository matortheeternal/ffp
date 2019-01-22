let ffp = require('../index'),
    path = require('path'),
    SyncReadableStream = require('../src/syncReadableStream');

let bytesPath = path.resolve(__dirname, './fixtures/bytes');

describe('ffp', () => {
    describe('resolveEntityType', () => {
        it('should throw an error if the entity type does not exist', () => {
            expect(() => {
                ffp.resolveEntityType({type: 'uint64'});
            }).toThrowError('Data type uint64 not found.');
        });
    });

    describe('resolveEntityFormat', () => {
        it('should throw an error if the entity type does not exist', () => {
            expect(() => {
                ffp.resolveEntityFormat({format: 'Person'});
            }).toThrowError('Data format Person not found.');
        });
    });

    describe('setEndianness', () => {
        it('should throw an error when invalid value passed', () => {
            expect(() => {
                ffp.setEndianness('SE');
            }).toThrowError('Endianness must be BE or LE.');
        });
    });
});

describe('SyncReadableStream', () => {
    let stream;

    beforeAll(() => {
        stream = new SyncReadableStream(bytesPath);
    });

    describe('read', () => {
        it('should throw an error if when read exceeds stream length', () => {
            expect(() => {
                stream.read(60);
            }).toThrowError('The stream has ended.');
        });
    });
});