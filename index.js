let SyncReadableStream = require('./src/syncReadableStream'),
    SyncWriteableStream = require('./src/syncWriteableStream');

let logger = console;

let dataFormats = {};

let dataTypes = {
    uint8: {
        read: stream => stream.read(1).readUInt8(),
        write: (stream, entity, data) => {
            let buf = Buffer.alloc(1);
            buf.writeUInt8(data);
            stream.write(buf);
        }
    },
    array: {
        read: (stream, entity, store) => {
            let count = readArrayCount(stream, entity, store),
                entryType = getDataType(entity.entry.type);
            if (!entryType)
                throw new Error(`Data type ${entity.entry.type} not found.`);
            let entries = [];
            for (let i = 0; i < count; i++)
                entries.push(entryType.read(stream, entity.entry));
            return entries;
        },
        write: (stream, entity, data) => {
            writeArrayCount(stream, entity, data);
            let entryType = getDataType(entity.entry.type);
            if (!entryType)
                throw new Error(`Data type ${entity.entry.type} not found.`);
            for (let i = 0; i < data.length; i++)
                entryType.write(stream, entity.entry, data[i]);
        }
    },
    record: {
        read: (stream, entity) => {
            let format = getDataFormat(entity.format);
            if (!format)
                throw new Error(`Data format ${entity.format} not found.`);
            return parseSchema(stream, format, {})
        },
        write: (stream, entity, data) => {
            let format = getDataFormat(entity.format);
            if (!format)
                throw new Error(`Data format ${entity.format} not found.`);
            writeSchema(stream, format, data);
        }
    },
    union: {
        read: (stream, entity, store) => {
            let switchValue = store[entity.switchKey],
                caseEntity = entity.cases[switchValue];
            if (!caseEntity)
                throw new Error(`Unknown union switch value ${switchValue}.`);
            let dataType = getDataType(caseEntity.type);
            if (!dataType)
                throw new Error(`Data type ${caseEntity.type} not found.`);
            return dataType.read(stream, caseEntity, store);
        },
        write: (stream, entity, data, context) => {
            let switchValue = context[entity.switchKey],
                caseEntity = entity.cases[switchValue];
            if (!caseEntity)
                throw new Error(`Unknown union switch value ${switchValue}.`);
            let dataType = getDataType(caseEntity.type);
            if (!dataType)
                throw new Error(`Data type ${caseEntity.type} not found.`);
            dataType.write(stream, caseEntity, data);
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

let readArrayCount = function(stream, entity, store) {
    if (entity.countKey) return store[entity.countKey];
    let countType = getDataType(entity.count.type);
    if (!countType)
        throw new Error(`Data type ${entity.count.type} not found.`);
    return countType.read(stream, entity);
};

let writeArrayCount = function(stream, entity, data) {
    if (entity.countKey) return;
    let countType = getDataType(entity.count.type);
    if (!countType)
        throw new Error(`Data type ${entity.count.type} not found.`);
    return countType.write(stream, entity, data.length);
};

let testExpectedValue = function(entity, value) {
    if (entity.expectedValue === value) return;
    let msg = `Expected value ${entity.expectedValue}, found ${value}`;
    if (entity.errorMessage) msg = `${entity.errorMessage}\n${msg}`;
    throw new Error(msg);
};

let parseEntity = function(stream, entity, store) {
    let dataType = getDataType(entity.type),
        value = dataType.read(stream, entity, store);
    if (entity.transform) value = entity.transform.read(value);
    if (entity.storageKey) store[entity.storageKey] = value;
    if (entity.expectedValue) testExpectedValue(entity, value);
    if (entity.callback) entity.callback(value, store);
};

let parseSchema = function(stream, schema, store = {}, key) {
    if (schema.constructor === Array) {
        if (key) store = store[key] = {};
        schema.forEach(entity => parseEntity(stream, entity, store));
    } else {
        if (key && !schema.hasOwnProperty('storageKey'))
            schema.storageKey = key;
        parseEntity(stream, schema, store);
    }
    return store;
};

let parseFile = function(filePath, schema, cb) {
    let stream = new SyncReadableStream(filePath),
        store = {};
    stream.onReady(() => {
        try {
            Object.keys(schema).forEach(key => {
                logger.log(`Parsing ${key}`);
                parseSchema(stream, schema[key], store, key);
            });
            let numBytes = stream.getRemainingBytes();
            logger.log(`Parsing "${filePath}" completed, ${numBytes} bytes unparsed.`);
            cb && cb(undefined, store);
        } catch (x) {
            cb && cb(x.message, store);
        }
    });
};

let writeEntity = function(stream, entity, context) {
    let dataType = getDataType(entity.type),
        data = entity.storageKey && context[entity.storageKey];
    if (entity.transform) data = entity.transform.write(data);
    return dataType.write(stream, entity, data, context);
};

let writeSchema = function(stream, schema, data) {
    if (schema.constructor === Array) {
        schema.forEach(entity => {
            writeEntity(stream, entity, data);
        });
    } else {
        writeEntity(stream, schema, data);
    }
};

let writeFile = function(filePath, schema, data, callback) {
    let stream = new SyncWriteableStream(filePath);
    Object.keys(schema).forEach(key => {
        logger.log(`Writing ${key}`);
        writeSchema(stream, schema[key], data);
    });
    stream.onFinish(() => {
        logger.log(`Writing "${filePath}" completed.`);
        callback && callback();
    });
    stream.end();
};

let addDataType = (name, type) => dataTypes[name] = type;
let getDataType = name => dataTypes[name];
let addDataFormat = (name, format) => dataFormats[name] = format;
let getDataFormat = name => dataFormats[name];
let setLogger = newLogger => logger = newLogger;

module.exports = {
    readUntil, readArrayCount, writeArrayCount,
    parseFile, parseSchema, parseEntity,
    writeFile, writeSchema, writeEntity,
    addDataType, getDataType,
    addDataFormat, getDataFormat,
    setLogger
};