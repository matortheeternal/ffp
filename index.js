let SyncReadableStream = require('./src/syncReadableStream'),
    SyncWriteableStream = require('./src/syncWriteableStream'),
    endianTypes = require('./src/endianTypes');

let logger = console;
let dataFormats = {};
let dataTypes = {};

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

let parseFile = function(filePath, schema) {
    schema = loadSchema(schema);
    let stream = new SyncReadableStream(filePath),
        data = {};
    parseSchema(stream, schema, data);
    let numBytes = stream.getRemainingBytes();
    logger.log(`Parsing "${filePath}" completed, ${numBytes} bytes unparsed.`);
    return data;
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

let writeFile = function(filePath, schema, data) {
    schema = loadSchema(schema);
    let stream = new SyncWriteableStream(filePath);
    writeSchema(stream, schema, data);
    logger.log(`Writing "${filePath}" completed, ${stream._pos} bytes written.`);
    stream.end();
};

let addDataType = (name, type) => dataTypes[name] = type;
let getDataType = name => dataTypes[name];
let resolveEntityType = entity => {
    let entityType = getDataType(entity.type);
    if (!entityType)
        throw new Error(`Data type ${entity.type} not found.`);
    return entityType;
};

let addDataFormat = (name, format) => dataFormats[name] = format;
let getDataFormat = name => dataFormats[name];
let resolveEntityFormat = entity => {
    let entityFormat = getDataFormat(entity.format);
    if (!entityFormat)
        throw new Error(`Data format ${entity.format} not found.`);
    return entityFormat;
};

let setEndianness = function(endianness) {
    if (endianness !== 'LE' && endianness !== 'BE')
        throw new Error('Endianness must be BE or LE.');
    Object.keys(endianTypes).forEach(key => {
        ffp[key].read = endianTypes[key].read[endianness];
        ffp[key].write = endianTypes[key].write[endianness];
    });
};

let setLogger = newLogger => logger = newLogger;

let ffp = {
    readUntil, readArrayCount, writeArrayCount,
    parseFile, parseSchema, parseEntity,
    writeFile, writeSchema, writeEntity,
    addDataType, getDataType, resolveEntityType,
    addDataFormat, getDataFormat, resolveEntityFormat,
    setEndianness, setLogger
};

// initialize endianness to LE
Object.keys(endianTypes).forEach(key => {
    ffp[key] = {
        read: endianTypes[key].read.LE,
        write: endianTypes[key].write.LE
    }
});

// load base data types
require('./src/baseDataTypes')(ffp);

module.exports = ffp;