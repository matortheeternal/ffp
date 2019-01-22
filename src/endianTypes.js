module.exports = {
    uint16: {
        read: {
            LE: stream => stream.read(2).readUInt16LE(),
            BE: stream => stream.read(2).readUInt16BE()
        },
        write: {
            LE: (stream, entity, data) => {
                let buf = Buffer.alloc(2);
                buf.writeUInt16LE(data);
                stream.write(buf);
                return buf;
            },
            BE: (stream, entity, data) => {
                let buf = Buffer.alloc(2);
                buf.writeUInt16BE(data);
                stream.write(buf);
                return buf;
            }
        }
    },
    uint32: {
        read: {
            LE: stream => stream.read(4).readUInt32LE(),
            BE: stream => stream.read(4).readUInt32BE()
        },
        write: {
            LE: (stream, entity, data) => {
                let buf = Buffer.alloc(4);
                buf.writeUInt32LE(data);
                stream.write(buf);
                return buf;
            },
            BE: (stream, entity, data) => {
                let buf = Buffer.alloc(4);
                buf.writeUInt32BE(data);
                stream.write(buf);
                return buf;
            }
        }
    },
    int16: {
        read: {
            LE: stream => stream.read(4).readInt16LE(),
            BE: stream => stream.read(4).readInt16BE()
        },
        write: {
            LE: (stream, entity, data) => {
                let buf = Buffer.alloc(2);
                buf.writeInt16LE(data);
                stream.write(buf);
                return buf;
            },
            BE: (stream, entity, data) => {
                let buf = Buffer.alloc(2);
                buf.writeInt16BE(data);
                stream.write(buf);
                return buf;
            }
        }
    },
    int32: {
        read: {
            LE: stream => stream.read(4).readInt32LE(),
            BE: stream => stream.read(4).readInt32BE()
        },
        write: {
            LE: (stream, entity, data) => {
                let buf = Buffer.alloc(4);
                buf.writeUInt32LE(data);
                stream.write(buf);
                return buf;
            },
            BE: (stream, entity, data) => {
                let buf = Buffer.alloc(4);
                buf.writeInt32BE(data);
                stream.write(buf);
                return buf;
            }
        }
    },
    float: {
        read: {
            LE: stream => stream.read(4).readFloatLE(),
            BE: stream => stream.read(4).readFloatBE()
        },
        write: {
            LE: (stream, entity, data) => {
                let buf = Buffer.alloc(4);
                buf.writeFloatLE(data);
                stream.write(buf);
                return buf;
            },
            BE: (stream, entity, data) => {
                let buf = Buffer.alloc(4);
                buf.writeFloatBE(data);
                stream.write(buf);
                return buf;
            }
        }
    }
};