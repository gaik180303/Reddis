const fs = require("fs");

function parseRDBFile(filePath) {
    const keys = [];
    try {
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
                // Read length-encoded string and skip
                const length = readLength(buffer, offset);
                offset += length.bytesRead + length.value;
                continue;
            }

            // Database selector
            if (type === 0xFE) {
                offset += readLength(buffer, offset).bytesRead;
                continue;
            }

            // Key-value pair
            if (type === 0) {
                // Read key
                const keyLength = readLength(buffer, offset);
                offset += keyLength.bytesRead;
                const key = buffer.slice(offset, offset + keyLength.value).toString();
                offset += keyLength.value;

                // Skip value length
                const valueLength = readLength(buffer, offset);
                offset += valueLength.bytesRead + valueLength.value;

                keys.push(key);
            }
        }
    } catch (err) {
        console.error('Error parsing RDB file:', err);
        return [];
    }
    return keys;
}

function readLength(buffer, offset) {
    let byte = buffer[offset];
    let type = (byte & 0xC0) >> 6; // Get first 2 bits
    
    if (type === 0) {
        // Length in this byte
        return { value: byte & 0x3F, bytesRead: 1 };
    } else if (type === 1) {
        // Length in next byte
        return { value: ((byte & 0x3F) << 8) | buffer[offset + 1], bytesRead: 2 };
    } else if (type === 2) {
        // Length in next 4 bytes
        return {
            value: ((byte & 0x3F) << 24) |
                  (buffer[offset + 1] << 16) |
                  (buffer[offset + 2] << 8) |
                  buffer[offset + 3],
            bytesRead: 4
        };
    } else {
        // Special encoding
        return { value: byte & 0x3F, bytesRead: 1 };
    }
}

module.exports = { parseRDBFile };