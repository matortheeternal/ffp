let {parseFile, addDataType, getDataFormat, addDataFormat} = require('../index'),
    path = require('path');

let iconPath = path.resolve(__dirname, './fixtures/icon.ico'),
    fakePath = path.resolve(__dirname, './fixtures/fake.ico');

describe('Parsing Files', () => {
    const icoMagic = 0x00000100;

    beforeAll(() => {
        addDataType('uint32', {
            read: stream => stream.read(4).readUInt32BE()
        });

        addDataType('uint32le', {
            read: stream => stream.read(4).readUInt32LE()
        });

        addDataType('uint16le', {
            read: stream => stream.read(2).readUInt16LE()
        });

        const PNG_HEADER = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

        addDataType('image blobs', {
            read: (stream, entity, store) => {
                store.images.forEach(image => {
                    //console.log('Parsing image ', image.len_img);
                    image.img = stream.read(image.len_img);
                    image.header = image.img.slice(0, 8);
                    image.is_png = image.header.equals(PNG_HEADER);
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

    it('should parse icon files', done => {
        let icoFormat = getDataFormat('ico'),
            start = new Date();
        parseFile(iconPath, icoFormat, (err, iconFile) => {
            console.log(`Completed parsing in ${new Date() - start}ms`);
            expect(err).toBeUndefined();
            expect(iconFile.magic).toBe(icoMagic);
            expect(iconFile.images).toBeDefined();
            expect(iconFile.imageData).toBeUndefined();
            expect(iconFile.images.constructor).toBe(Array);
            expect(iconFile.images.length).toBe(9);
            expect(iconFile.images[0].img).toBeDefined();
            expect(iconFile.images[0].header).toBeDefined();
            expect(iconFile.images[0].is_png).toBeDefined();
            done();
        });
    });

    it('should raise exception if magic doesn\'t match', done => {
        let msg = `ICO magic does not match.\nExpected value ${icoMagic}, found 1633837924`,
            icoFormat = getDataFormat('ico');
        parseFile(fakePath, icoFormat, err => {
            console.log(err);
            expect(err).toBeDefined();
            expect(err).toBe(msg);
            done();
        });
    });
});