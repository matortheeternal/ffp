let {parseFile, writeFile, addDataType, getDataFormat, addDataFormat} = require('../index'),
    fs = require('fs'),
    path = require('path');

let inputPath = path.resolve(__dirname, './fixtures/icon.ico'),
    outputPath = path.resolve(__dirname, './output/icon.ico');

describe('Writing Files', () => {
    const icoMagic = 0x00000100;

    beforeAll(() => {
        addDataType('uint32', {
            read: stream => stream.read(4).readUInt32BE(),
            write: (stream, entity, data) => {
                let buf = Buffer.alloc(4);
                buf.writeUInt32BE(data);
                stream.write(buf);
            }
        });

        addDataType('uint32le', {
            read: stream => stream.read(4).readUInt32LE(),
            write: (stream, entity, data) => {
                let buf = Buffer.alloc(4);
                buf.writeUInt32LE(data);
                stream.write(buf);
            }
        });

        addDataType('uint16le', {
            read: stream => stream.read(2).readUInt16LE(),
            write: (stream, entity, data) => {
                let buf = Buffer.alloc(2);
                buf.writeUInt16LE(data);
                stream.write(buf);
            }
        });

        const PNG_HEADER = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

        addDataType('image blobs', {
            read: (stream, entity, store) => {
                store.images.forEach(image => {
                    image.img = stream.read(image.len_img);
                    image.header = image.img.slice(0, 8);
                    image.is_png = image.header.equals(PNG_HEADER);
                });
            },
            write: (stream, entity, data, context) => {
                console.log(`Writing ${context.images.length} image blobs`);
                context.images.forEach(image => {
                    stream.write(image.img);
                });
            }
        });

        addDataFormat('IconDirEntry', [{
            type: 'uint8',
            storageKey: 'width'
        }, {
            type: 'uint8',
            storageKey: 'height'
        }, {
            type: 'uint8',
            storageKey: 'num_colors'
        }, {
            type: 'uint8',
            storageKey: 'reserved'
        }, {
            type: 'uint16le',
            storageKey: 'num_planes'
        }, {
            type: 'uint16le',
            storageKey: 'bpp'
        }, {
            type: 'uint32le',
            storageKey: 'len_img'
        }, {
            type: 'uint32le',
            storageKey: 'ofs_img'
        }]);

        addDataFormat('ico', [{
            type: 'uint32',
            expectedValue: icoMagic,
            errorMessage: 'ICO magic does not match.',
            storageKey: 'magic'
        }, {
            type: 'array',
            count: {type: 'uint16le'},
            entry: {type: 'record', format: 'IconDirEntry'},
            storageKey: 'images'
        }, {
            type: 'image blobs',
            storageKey: null
        }]);
    });

    it('should read and write binary-identical icon files', done => {
        parseFile(inputPath, 'ico', (err, iconFile) => {
            expect(err).toBeUndefined();
            writeFile(outputPath, 'ico', iconFile, err => {
                expect(err).toBeUndefined();
                let input = fs.readFileSync(inputPath),
                    output = fs.readFileSync(outputPath);
                expect(input).toBeDefined();
                expect(output).toBeDefined();
                expect(Buffer.isBuffer(input)).toBe(true);
                expect(Buffer.isBuffer(output)).toBe(true);
                expect(input.length).toBe(output.length);
                expect(input).toEqual(output);
                done();
            });
            done();
        });
    });
});