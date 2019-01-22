let ffp = require('../index'),
    path = require('path'),
    fs = require('fs');

let numbersPath = path.resolve(__dirname, './output/numbers');

describe('Writing Numbers', () => {
    let stream, data = {
        uint8: 0xFF,
        uint16: 0x1001,
        uint32: 0x12345678,
        int32: -2147483648
    };

    beforeAll(() => {
        ffp.setEndianness('BE');

        // using special uint8 type here so we can test the
        // output buffer without having to read the file
        ffp.addDataType('test uint8', {
            write: (stream, entity, data) => {
                let buf = Buffer.alloc(1);
                buf.writeUInt8(data);
                stream.write(buf);
                return buf;
            }
        });

        stream = fs.createWriteStream(numbersPath);
    });

    it('should write uint8 values', () => {
        let output = ffp.writeEntity(stream, {
            type: 'test uint8',
            storageKey: 'uint8'
        }, data);
        expect(output).toBeDefined();
        expect(Buffer.isBuffer(output)).toBe(true);
        expect(output.length).toBe(1);
        expect(output.readUInt8()).toEqual(data.uint8);
    });

    it('should write uint16 values', () => {
        let output = ffp.writeEntity(stream, {
            type: 'uint16',
            storageKey: 'uint16'
        }, data);
        expect(output).toBeDefined();
        expect(Buffer.isBuffer(output)).toBe(true);
        expect(output.length).toBe(2);
        expect(output.readUInt16BE()).toEqual(data.uint16);
    });

    it('should write uint32 values', () => {
        let output = ffp.writeEntity(stream, {
            type: 'uint32',
            storageKey: 'uint32'
        }, data);
        expect(output).toBeDefined();
        expect(Buffer.isBuffer(output)).toBe(true);
        expect(output.length).toBe(4);
        expect(output.readUInt32BE()).toEqual(data.uint32);
    });

    it('should write int32 values', () => {
        let output = ffp.writeEntity(stream, {
            type: 'int32',
            storageKey: 'int32'
        }, data);
        expect(output).toBeDefined();
        expect(Buffer.isBuffer(output)).toBe(true);
        expect(output.length).toBe(4);
        expect(output.readInt32BE()).toEqual(data.int32);
    });
});