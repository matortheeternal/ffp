let ffp = require('../index'),
    path = require('path'),
    fs = require('fs');

let bytesPath = path.resolve(__dirname, './output/bytes');

describe('Writing Bytes', () => {
    let stream, data = { bytes: 0x12345678 };

    beforeAll(() => {
        ffp.addDataType('bytes', {
            write: (stream, entity, data) => {
                let buf = Buffer.alloc(4);
                buf.writeUInt32BE(data);
                stream.write(buf);
                return buf;
            }
        });

        stream = fs.createWriteStream(bytesPath);
    });

    it('should write the bytes to disk', () => {
        let output = ffp.writeEntity(stream, {
            type: 'bytes',
            storageKey: 'bytes'
        }, data);

        expect(output).toBeDefined();
        expect(Buffer.isBuffer(output)).toBe(true);
        expect(output.length).toBe(4);
        expect(output.readUInt32BE()).toBe(data.bytes);
    });
});