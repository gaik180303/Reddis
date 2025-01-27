const fs = require("fs");

function parseRDBFile(filePath) {
    const keys = [];
    try {
        const buffer = fs.readFileSync(filePath);

        // Validate header
        const header = buffer.slice(0, 9).toString("ascii");
        if (header !== "REDIS0011") {
            throw new Error("Invalid RDB file format.");
        }

        let offset = 9; // Start reading after the header

        while (offset < buffer.length) {
            const byte = buffer[offset];
            offset++;

            // Check for the start of a metadata or database section
            if (byte === 0xFA || byte === 0xFE) {
                continue; // Skip metadata or database markers
            }

            // Check for end of file marker
            if (byte === 0xFF) {
                break;
            }

            // Handle key-value pairs
            if (byte === 0x00) {
                // Key-value pair starts here
                const keyLength = buffer[offset];
                offset++;
                const key = buffer.slice(offset, offset + keyLength).toString();
                offset += keyLength;

                const valueLength = buffer[offset];
                offset++;
                offset += valueLength; // Skip value for now (not needed for this task)

                keys.push(key);
            }
        }
    } catch (err) {
        console.error(`Error parsing RDB file: ${err.message}`);
    }

    return keys;
}

module.exports = { parseRDBFile };
