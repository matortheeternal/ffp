const fs = require('fs');

let log = console.log;

let dataFormats = {};

let dataTypes = {
    uint8: {
        read: stream => stream.read(1).readUInt8()
    },
    array: {
        read: (stream, entity) => {
            let entryType = getDataType(entity.entry.type),
                countType = getDataType(entity.count.type);
            if (!entryType)
                throw new Error(`Data type ${entity.entry.type} not found.`);
            if (!countType)
                throw new Error(`Data type ${entity.count.type} not found.`);
            let count = countType.read(stream, entity),
                entries = [];
            for (let i = 0; i < count; i++)
                entries.push(entryType.read(stream, entity.entry));
            return entries;
        }
    },
    record: {
        read: (stream, entity) => {
            let format = getDataFormat(entity.format);
            if (!format)
                throw new Error(`Data format ${entity.format} not found.`);
            return parseSchema(stream, format, {})
        }
    },
    union: {
        read: (stream, entity, store) => {
            return entity.decide(stream, entity, store);
        }
    }
};

let readUntil = function(stream, val, size = 1, methodName = 'readUInt8') {
    let bytes = [];
    while (true) {
        let chunk = stream.read(size);
        if (chunk[methodName]() === val) break;
        bytes.push(chunk);
    }
    return Buffer.concat(bytes);
};

let parseEntity = function(stream, entity, store) {
    let dataType = getDataType(entity.type),
        value = dataType.read(stream, entity, store);
    if (entity.storageKey) store[entity.storageKey] = value;
    if (entity.callback) entity.callback(value);
};

let parseSchema = function(stream, schema, store, key) {
    if (schema.constructor === Array) {
        if (key) store = store[key] = {};
        schema.forEach(entity => parseEntity(stream, entity, store));
    } else {
        if (key && !schema.storageKey) schema.storageKey = key;
        parseEntity(stream, schema, store);
    }
    return store;
};

let parseFile = function(filePath, schema, store) {
    let stream = fs.createReadStream(filePath);
    stream.on('readable', () => {
        if (stream.closed) return;
        Object.keys(schema).forEach(key => {
            log(`Parsing ${key}`);
            parseSchema(stream, schema[key], store, key);
        });
        let buf = stream.read();
        stream.destroy();
        log(!buf ? 'File parsing completed, no leftover data.' :
            `File parsing completed, ${buf.length} unparsed bytes`);
    });
};

let addDataType = (name, type) => dataTypes[name] = type;
let getDataType = name => dataTypes[name];
let addDataFormat = (name, format) => dataFormats[name] = format;
let getDataFormat = name => dataFormats[name];
let setLogCallback = fn => log = fn;

module.exports = {
    readUntil,
    parseFile, parseSchema, parseEntity,
    addDataType, getDataType,
    addDataFormat, getDataFormat,
    setLogCallback
};