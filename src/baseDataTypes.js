module.exports = function(ffp) {
    ffp.uint8 = {
        read: stream => stream.read(1).readUInt8(),
        write: (stream, entity, data) => {
            let buf = Buffer.alloc(1);
            buf.writeUInt8(data);
            stream.write(buf);
        }
    };

    ffp.addDataType('uint8', ffp.uint8);
    ffp.addDataType('uint16', ffp.uint16);
    ffp.addDataType('uint32', ffp.uint32);
    ffp.addDataType('int16', ffp.int16);
    ffp.addDataType('int32', ffp.int32);
    ffp.addDataType('float', ffp.float);

    ffp.addDataType('array', {
        read: (stream, entity, context) => {
            let count = ffp.readArrayCount(stream, entity, context),
                entryType = ffp.resolveEntityType(entity.entry);
            let entries = [];
            for (let i = 0; i < count; i++)
                entries.push(entryType.read(stream, entity.entry));
            return entries;
        },
        write: (stream, entity, data, context) => {
            ffp.writeArrayCount(stream, entity, data, context);
            let entryType = ffp.resolveEntityType(entity.entry);
            for (let i = 0; i < data.length; i++)
                entryType.write(stream, entity.entry, data[i]);
        }
    });

    ffp.addDataType('record', {
        read: (stream, entity) => {
            let format = ffp.resolveEntityFormat(entity);
            return ffp.parseSchema(stream, format, {})
        },
        write: (stream, entity, data) => {
            let format = ffp.resolveEntityFormat(entity);
            ffp.writeSchema(stream, format, data);
        }
    });

    let resolveCaseEntity = (entity, switchValue) => {
        let caseEntity = entity.cases[switchValue];
        if (!caseEntity)
            throw new Error(`Unknown union switch value ${switchValue}.`);
        return caseEntity;
    };

    ffp.addDataType('union', {
        read: (stream, entity, context) => {
            let switchValue = context[entity.switchKey],
                caseEntity = resolveCaseEntity(entity, switchValue),
                dataType = ffp.resolveEntityType(caseEntity);
            return dataType.read(stream, caseEntity, context);
        },
        write: (stream, entity, data, context) => {
            let switchValue = context[entity.switchKey],
                caseEntity = resolveCaseEntity(entity, switchValue),
                dataType = ffp.resolveEntityType(caseEntity);
            dataType.write(stream, caseEntity, data);
        }
    });
};