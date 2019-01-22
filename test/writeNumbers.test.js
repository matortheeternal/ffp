let ffp = require('../index'),
    path = require('path'),
    fs = require('fs');

let numbersPath = path.resolve(__dirname, './output/numbers');

['BE', 'LE'].forEach(endianness => {
    describe(`Writing Numbers (${endianness})`, () => {
        let stream, data = {
            uint8: 0xFF,
            uint16: 0x1001,
            uint32: 0x12345678,
            int16: -32768,
            int32: -2147483648,
            float: 1.2345600128173828
        };

        beforeAll(() => {
            ffp.setEndianness(endianness);
            stream = fs.createWriteStream(numbersPath + endianness);
        });

        it('should write uint8 values', () => {
            let output = ffp.writeEntity(stream, {
                type: 'uint8',
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
            let readMethod = `readUInt16${endianness}`;
            expect(output[readMethod]()).toEqual(data.uint16);
        });

        it('should write uint32 values', () => {
            let output = ffp.writeEntity(stream, {
                type: 'uint32',
                storageKey: 'uint32'
            }, data);
            expect(output).toBeDefined();
            expect(Buffer.isBuffer(output)).toBe(true);
            expect(output.length).toBe(4);
            let readMethod = `readUInt32${endianness}`;
            expect(output[readMethod]()).toEqual(data.uint32);
        });

        it('should write int16 values', () => {
            let output = ffp.writeEntity(stream, {
                type: 'int16',
                storageKey: 'int16'
            }, data);
            expect(output).toBeDefined();
            expect(Buffer.isBuffer(output)).toBe(true);
            expect(output.length).toBe(2);
            let readMethod = `readInt16${endianness}`;
            expect(output[readMethod]()).toEqual(data.int16);
        });

        it('should write int32 values', () => {
            let output = ffp.writeEntity(stream, {
                type: 'int32',
                storageKey: 'int32'
            }, data);
            expect(output).toBeDefined();
            expect(Buffer.isBuffer(output)).toBe(true);
            expect(output.length).toBe(4);
            let readMethod = `readInt32${endianness}`;
            expect(output[readMethod]()).toEqual(data.int32);
        });

        it('should write float values', () => {
            let output = ffp.writeEntity(stream, {
                type: 'float',
                storageKey: 'float'
            }, data);
            expect(output).toBeDefined();
            expect(Buffer.isBuffer(output)).toBe(true);
            expect(output.length).toBe(4);
            let readMethod = `readFloat${endianness}`;
            expect(output[readMethod]()).toEqual(data.float);
        });
    });
});