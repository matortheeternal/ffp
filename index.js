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

let readArrayCount = function(stream, entity, context) {
    if (entity.countKey) return context[entity.countKey];
    let countType = resolveEntityType(entity.count);
    return countType.read(stream, entity.count, context);
};

let writeArrayCount = function(stream, entity, data, context) {
    if (entity.countKey) return;
    let countType = resolveEntityType(entity.count);
    return countType.write(stream, entity.count, data.length, context);
};

let testExpectedValue = function(entity, value) {
    if (entity.expectedValue === value) return;
    let msg = `Expected value ${entity.expectedValue}, found ${value}`;
    if (entity.errorMessage) msg = `${entity.errorMessage}\n${msg}`;
    throw new Error(msg);
};

let loadSchema = function(schema) {
    return typeof schema === 'string' ? getDataFormat(schema) : schema;
};

let parseEntity = function(stream, entity, context) {
    let dataType = resolveEntityType(entity),
        value = dataType.read(stream, entity, context);
    if (entity.transform) value = entity.transform.read(value);
    if (entity.storageKey) context[entity.storageKey] = value;
    if (entity.expectedValue) testExpectedValue(entity, value);
    if (entity.callback) entity.callback(value, context);
};

let parseSchema = function(stream, schema, context = {}) {
    schema.forEach(entity => parseEntity(stream, entity, context));
    return context;
};

let parseFile = function(filePath, schema, cb) {
    schema = loadSchema(schema);
    let stream = new SyncReadableStream(filePath),
        data = {};
    stream.onReady(() => {
        try {
            parseSchema(stream, schema, data);
            let numBytes = stream.getRemainingBytes();
            logger.log(`Parsing "${filePath}" completed, ${numBytes} bytes unparsed.`);
            cb && cb(undefined, data);
        } catch (x) {
            logger.error(x);
            cb && cb(x.message, data);
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
    schema.forEach(entity => writeEntity(stream, entity, data));
};

let writeFile = function(filePath, schema, data, cb) {
    schema = loadSchema(schema);
    let stream = new SyncWriteableStream(filePath);
    stream.onReady(() => {
        try {
            writeSchema(stream, schema, data);
            logger.log(`Writing "${filePath}" completed, ${stream._pos} bytes written.`);
            stream.end();
        } catch(x) {
            logger.error(x);
            cb && cb(x.message);
        }
    });
    stream.onFinish(() => {
        logger.log(`Writing "${filePath}" completed.`);
        cb && cb();
    });
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