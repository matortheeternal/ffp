let ffp = require('../index'),
    path = require('path'),
    fs = require('fs');

let stringsPath = path.resolve(__dirname, './output/strings');

describe('Writing Strings', () => {
    let stream, data = {
        str: 'utf-8 很棒',
        pstr: 'pascal-style',
        wstr: 'ucs2-is-wide'
    };

    beforeAll(() => {
        ffp.addDataType('utf8 string', {
            write: (stream, entity, data) => {
                let buf = Buffer.concat([
                    Buffer.from(data, 'utf8'),
                    Buffer.alloc(1)
                ]);
                stream.write(buf);
                return buf;
            }
        });

        ffp.addDataType('pascal string', {
            write: (stream, entity, data) => {
                let buf = Buffer.alloc(2 + data.length);
                buf.writeUInt16BE(data.length);
                buf.write(data, 2, data.length, 'ascii');
                stream.write(buf);
                return buf;
            }
        });

        ffp.addDataType('ucs2 string', {
            write: (stream, entity, data) => {
                let buf = Buffer.alloc(2 * data.length + 2);
                buf.write(data, 0, 2 * data.length, 'ucs2');
                stream.write(buf);
                return buf;
            }
        });

        stream = fs.createWriteStream(stringsPath);
    });

    it('should parse utf8 strings', () => {
        let output = ffp.writeEntity(stream, {
            type: 'utf8 string',
            storageKey: 'str'
        }, data);
        expect(output).toBeDefined();
        expect(Buffer.isBuffer(output)).toBe(true);
        expect(output.length).toBe(13);
        expect(output.slice(0, -1).toString('utf8')).toBe(data.str);
    });

    it('should parse pascal strings', () => {
        let output = ffp.writeEntity(stream, {
            type: 'pascal string',
            storageKey: 'pstr'
        }, data);
        expect(output).toBeDefined();
        expect(Buffer.isBuffer(output)).toBe(true);
        expect(output.length).toBe(14);
        expect(output.slice(2).toString('ascii')).toBe(data.pstr);
    });

    it('should parse ucs2 strings', () => {
        let output = ffp.writeEntity(stream, {
            type: 'ucs2 string',
            storageKey: 'wstr'
        }, data);
        expect(output).toBeDefined();
        expect(Buffer.isBuffer(output)).toBe(true);
        expect(output.length).toBe(26);
        expect(output.slice(0, -2).toString('ucs2')).toBe(data.wstr);
    });
});