// const fs = require("fs");
// const { off } = require("process");

// function parseRDBFile(filePath) {
//     const keyValueMap = new Map();
//     try {
//         console.log(`Parsing RDB file: ${filePath}`);
//         const buffer = fs.readFileSync(filePath);
        
//         // Validate header (REDIS + version)
//         const header = buffer.slice(0, 5).toString();
//         if (header !== 'REDIS') {
//             throw new Error("Invalid RDB file format");
//         }

//         let offset = 9; // Skip header and version

//         while (offset < buffer.length) {
//             const type = buffer[offset];
//             offset++;

//             // EOF marker
//             if (type === 0xFF) {
//                 break;
//             }

//             // Skip auxiliary fields and other metadata
//             if (type === 0xFA || type === 0xFB || type === 0xFC || type === 0xFD) {
//                 // Read length-encoded string and skip
//                 const length = readLength(buffer, offset);
//                 offset += length.bytesRead + length.value;
//                 continue;
//             }

//             // Database selector
//             if (type === 0xFE) {
//                 offset += readLength(buffer, offset).bytesRead;
//                 continue;
//             }

//             // Key-value pair
//             // if (type === 0) {
//                 // Read key
//                 const keyLength = readLength(buffer, offset);
//                 offset += keyLength.bytesRead;
//                 const key = buffer.slice(offset, offset + keyLength.value).toString();
//                 offset += keyLength.value;

                
//                 const valueType = buffer[offset];
//                 offset++;

//                 if (valueType === 0) {  // String encoding
//                     const valueLength = readLength(buffer, offset);
//                     offset += valueLength.bytesRead;
//                     const value = buffer.slice(offset, offset + valueLength.value).toString();
//                     offset += valueLength.value;
//                     keyValueMap.set(key, value);
//                     console.log(`Parsed key-value pair: ${key} => ${value}`);

//                 //let value;


//                 // Handle length-prefixed string value
//         //         switch(valueType)
//         //         {
//         //             case 0:
//         //                 const valueLength = readLength(buffer, offset);
//         //                 offset += valueLength.bytesRead;
//         //                 value = buffer.slice(offset, offset + valueLength.value).toString();
//         //                 offset += valueLength.value;    
//         //                 break;

//         //             case 1:
//         //                 value = buffer[offset];
//         //                 offset++;
//         //                 break;
                    
//         //             case 2:
//         //                 value = buffer.readInt16LE(offset);
//         //                 offset += 2;
//         //                 break;
//         //             case 3:
//         //                 value = ((buffer[offset] << 24) | (buffer[offset + 1] << 16) | 
//         //                 (buffer[offset + 2] << 8) | buffer[offset + 3]).toString();
//         //                 offset += 4;
//         //                 break;

//         //                 default:
//         //                     const skipLength = readLength(buffer, offset);
//         //                     offset += skipLength.bytesRead + skipLength.value;
//         //                     continue;
//         //         }
//         //         keyValueMap.set(key, value);
//             }
//         }
//     } 
//     catch (err) {
//         console.error('Error parsing RDB file:', err);
//         throw err;
//     }
//     console.log('Parsed key-value pairs:',Array.from(keyValueMap.entries()));
//     return keyValueMap;
// }

// function readLength(buffer, offset) {
//     let byte = buffer[offset];
//     let type = (byte & 0xC0) >> 6; // Get first 2 bits
    
//     if (type === 0) {
//         // Length in this byte
//         return { value: byte & 0x3F, bytesRead: 1 };
//     } else if (type === 1) {
//         // Length in next byte
//         return { value: ((byte & 0x3F) << 8) | buffer[offset + 1], bytesRead: 2 };
//     } else if (type === 2) {
//         // Length in next 4 bytes
//         return {
//             value: ((byte & 0x3F) << 24) |
//                   (buffer[offset + 1] << 16) |
//                   (buffer[offset + 2] << 8) |
//                   buffer[offset + 3],
//             bytesRead: 4
//         };
//     } else {
//         // Special encoding
//         return { value: byte & 0x3F, bytesRead: 1 };
//     }
// }

// module.exports = { parseRDBFile };


const fs = require("fs");

function parseRDBFile(filePath) {
    const keyValueMap = new Map();
    try {
        console.log(`Parsing RDB file: ${filePath}`);
        const buffer = fs.readFileSync(filePath);
        
        // Validate header (REDIS + version)
        const header = buffer.slice(0, 5).toString();
        if (header !== 'REDIS') {
            throw new Error("Invalid RDB file format");
        }

        let offset = 9; // Skip header and version

        while (offset < buffer.length) {
            const type = buffer[offset];
            offset++;

            // EOF marker
            if (type === 0xFF) {
                break;
            }

            // Skip auxiliary fields and other metadata
            if (type === 0xFA || type === 0xFB || type === 0xFC || type === 0xFD) {
                const length = readLength(buffer, offset);
                offset += length.bytesRead + length.value;
                continue;
            }

            // Database selector
            if (type === 0xFE) {
                offset += readLength(buffer, offset).bytesRead;
                continue;
            }

            // Read key
            const keyLength = readLength(buffer, offset);
            offset += keyLength.bytesRead;
            const key = buffer.slice(offset, offset + keyLength.value).toString();
            offset += keyLength.value;

            // Read value type
            const valueType = buffer[offset];
            offset++;

            let value;
            switch(valueType) {
                case 0: // String encoding
                    const strLength = readLength(buffer, offset);
                    offset += strLength.bytesRead;
                    value = buffer.slice(offset, offset + strLength.value).toString();
                    offset += strLength.value;
                    break;

                case 1: // Integer 8
                    value = buffer[offset].toString();
                    offset++;
                    break;
                
                case 2: // Integer 16
                    value = buffer.readInt16LE(offset).toString();
                    offset += 2;
                    break;

                case 3: // Integer 32
                    value = ((buffer[offset] << 24) | 
                            (buffer[offset + 1] << 16) | 
                            (buffer[offset + 2] << 8) | 
                            buffer[offset + 3]).toString();
                    offset += 4;
                    break;

                case 9: // List type
                    const listLength = readLength(buffer, offset);
                    offset += listLength.bytesRead;
                    const elements = [];
                    for (let i = 0; i < listLength.value; i++) {
                        const elemLength = readLength(buffer, offset);
                        offset += elemLength.bytesRead;
                        const element = buffer.slice(offset, offset + elemLength.value).toString();
                        offset += elemLength.value;
                        elements.push(element);
                    }
                    value = elements[0]; // Take first element for simple string response
                    break;

                default:
                    console.log(`Skipping unknown value type: ${valueType}`);
                    const skipLength = readLength(buffer, offset);
                    offset += skipLength.bytesRead + skipLength.value;
                    continue;
            }

            if (value !== undefined) {
                console.log(`Storing key-value pair: ${key} => ${value}`);
                keyValueMap.set(key, value);
            }
        }
    } catch (err) {
        console.error('Error parsing RDB file:', err);
        throw err;
    }

    console.log('Parsed key-value pairs:', Array.from(keyValueMap.entries()));
    return keyValueMap;
}

