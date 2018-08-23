# ffp ![](https://travis-ci.org/matortheeternal/ffp.svg?branch=master) [![codecov](https://codecov.io/gh/matortheeternal/ffp/branch/master/graph/badge.svg)](https://codecov.io/gh/matortheeternal/ffp)
File format parser which makes it easy to parse binary file formats through data schemas.

The primary goal of `ffp` is to make it easy to make file format parsers and writers.  This is done through defining sequences of entities (data formats) and types (data readers/writers).

`ffp` comes with built-in support for several basic data types, and allows you to define other data types as needed.

## installation

```
npm i ffp --save
``` 

## usage

```js
let ffp = require('ffp');

// ffp.addDataType - adds a data type to ffp
ffp.addDataType('string', {
    read: (stream, entity, store) => {
        let uint8 = ffp.getDataType('uint8'),
            length = uint8.read(stream, entity, store),
            buf = stream.read(length);
        return buf.toString('ascii');
    },
    write: (stream, entity, data, context) => {
        let uint8 = ffp.getDataType('uint8');
        uint8.write(stream, entity, data.length, context);
        stream.write(Buffer.alloc(data.length, data, 'ascii'));
    }
});

// ffp.addDataFormat - adds a data format to ffp
ffp.addDataFormat('MyFileType', [{
    type: 'array', 
    count: {type: 'uint8'}, 
    entry: {type: 'uint8'},
    storageKey: 'someBytes'
}, {
    type: 'string',
    storageKey: 'aString'
}]);

ffp.parseFile('path/to/file', 'MyFileType', (err, data) => {
    if (err) return;
    console.log(data.someBytes); // array of uint8 numbers
    console.log(data.aString);   // a string parsed after the array
});
```

See the tests for more thorough code examples.  E.g. [writeFile.test.js](https://github.com/matortheeternal/ffp/tree/master/test/writeFile.test.js) shows how to read and write `ico` files.

## api

### entities

At a fundamental level, `ffp` functions by parsing entity definitions.  Entity definitions are JavaScript objects with properties which instruct `ffp` and data readers on how to read, write, and store data.

The following base properties are part of how `ffp` works with entities.  Additional properties may be expected by data type readers/writers.

- `type` - Required.  The data type to use to read/write the entity.
- `storageKey` - Recommended.  The key where the data will be stored when reading, and is expected to exist when writing.  You should only omit the `storageKey` for entities that use types which data storage included in their readers and writers.

### schemas

In `ffp`, a schema is just a sequence of entities.  Schemas can be nested inside of each other using the `array`, `record`, and `union` data types.  Schemas are also referred to as "data formats" internally.

### provided data types

`ffp` provides several data types out of the box to help you get started parsing files.  The data types provided are for standard use cases and aren't intended to be complete.

- `uint8` - 1 byte unsigned integer.
- `array` - Array of any other type.  The size of the array is expected before the contents of the array.  The type used for the size can any integer type.  Entity properties:
    - `count` - entity for the count.
    - `countKey` - key where the count can be found, if it was parsed as a separate entity.  Takes precedence over `count` (provide one or the other).
    - `entry` - entity for array entries.  Required.
- `record` - A reference to a data format registered with `ffp.addDataFormat`.  Entity properties:
    - `format` - The name of the data format to use when reading/writing the record.
- `union` - Switches between parsing different data types based on a previously parsed value. Entity properties:
    - `switchKey` - The key to the data to "switch" on.  Resolved relative to the entities data storage context.
    - `cases` - Object which is used to determine the entity to parse.  Keys should correspond to possible data switch values.  Values should be entity objects.

### `ffp.parseFile(filePath, schema, cb)`

Loads and parses the file at `filePath` according to `schema`.  Calls the callback `cb` once parsing is completed.

**Arguments:**  
- `filePath` - Path to the file to load and parse.
- `schema` - Name of the schema to use when parsing the file or the schema itself.
- `cb` - Callback to execute when parsing is completed.  Arguments:
    - `err` - Undefined if parsing was successful, else it will contain an error message.
    - `data` - Object containing the data that was stored when parsing the file, according to the schema's structure and entity `storageKey` properties.

### `ffp.writeFile`

Writes a file to `filePath` according to `schema` and `data`.  Calls the callback `cb` once writing is completed.

**Arguments:**  
- `filePath` - Path to the file to write to disk.
- `schema` - Name of the schema to use when parsing the file or the schema itself.
- `data` - Data structure to write to disk.  Should have every property expected by the `schema`.
- `cb` - Callback to execute when writing is completed.  Arguments:
    - `err` - Undefined if writing the file was successful, else it will contain an error message.

### `ffp.addDataType`

Adds a data type to `ffp`.

**Arguments:**  
- `name` - Unique string identifier for the data type.
- `type` - Object which contains a data reader and a data writer for the type.  Properties:
    - `read` - Called to read the data type from a stream.  Arguments:
        - `stream` - The `SyncReadableStream` to read the data from.  Use `stream.read(n)` to read `n` bytes from the stream (returns a `Buffer`).
        - `entity` - The current entity you're reading data for.
        - `context` - The current data storage context of the reader.
    - `write` - Called to write the data type to the stream.  Arguments:
        - `stream` - The `SyncWriteableStream` to write the data to.  Use `stream.write(buf)` to write the Buffer `buf` to the stream.
        - `entity` - The current entity you're writing data for.
        - `data` - The data you are writing to the stream.
        - `context` - The current data storage context of the writer.

### `ffp.getDataType`

Gets a data type from `ffp` matching `name`.  Returns the data type if found.

**Arguments:**  
- `name` - Unique string identifier of the data type to get.

### `ffp.addDataFormat`

Adds a data format to `ffp`.

**Arguments:**  
- `name` - Unique string identifier for the data format.
- `format` - Schema array, as described in the [schemas section](#schemas).

### `ffp.getDataFormat`

Gets a data format from `ffp` matching `name`.  Returns the data format if found.

**Arguments:**  
- `name` - Unique string identifier of the data format to get.