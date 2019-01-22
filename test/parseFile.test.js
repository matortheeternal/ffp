let ffp = require('../index'),
    path = require('path');

let iconPath = path.resolve(__dirname, './fixtures/icon.ico'),
    fakePath = path.resolve(__dirname, './fixtures/fake.ico');

describe('Parsing Files', () => {
    const icoMagic = 0x00000100;

    beforeAll(() => {
        ffp.setEndianness('LE');

        ffp.addDataType('uint32be', {
            read: stream => stream.read(4).readUInt32BE()
        });

        const PNG_HEADER = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

        ffp.addDataType('image blobs', {
            read: (stream, entity, store) => {
                store.images.forEach(image => {
                    //console.log('Parsing image ', image.len_img);
                    image.img = stream.read(image.len_img);
                    image.header = image.img.slice(0, 8);
                    image.is_png = image.header.equals(PNG_HEADER);
                });
            }
        });

        ffp.addDataFormat('IconDirEntry', [{
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
            type: 'uint16',
            storageKey: 'num_planes'
        }, {
            type: 'uint16',
            storageKey: 'bpp'
        }, {
            type: 'uint32',
            storageKey: 'len_img'
        }, {
            type: 'uint32',
            storageKey: 'ofs_img'
        }]);

        ffp.addDataFormat('ico', [{
            type: 'uint32be',
            expectedValue: icoMagic,
            errorMessage: 'ICO magic does not match.',
            storageKey: 'magic'
        }, {
            type: 'array',
            count: {type: 'uint16'},
            entry: {type: 'record', format: 'IconDirEntry'},
            storageKey: 'images'
        }, {
            type: 'image blobs',
            storageKey: null
        }]);
    });

    it('should parse icon files', () => {
        let start = new Date(),
            iconFile = ffp.parseFile(iconPath, 'ico');
        console.log(`Completed parsing in ${new Date() - start}ms`);
        expect(iconFile.magic).toBe(icoMagic);
        expect(iconFile.images).toBeDefined();
        expect(iconFile.imageData).toBeUndefined();
        expect(iconFile.images.constructor).toBe(Array);
        expect(iconFile.images.length).toBe(9);
        expect(iconFile.images[0].img).toBeDefined();
        expect(iconFile.images[0].header).toBeDefined();
        expect(iconFile.images[0].is_png).toBeDefined();
    });

    it('should raise exception if magic doesn\'t match', () => {
        let msg = `ICO magic does not match.\nExpected value ${icoMagic}, found 1633837924`;
        try {
            ffp.parseFile(fakePath, 'ico');
        } catch (x) {
            expect(x.message).toBe(msg);
        }
    });
});