// const net = require("net");
// const os = require("os");
// const path = require("path");
// const { parseRDBFile } = require("./rdbParser");
// const { connect } = require("http2");

// const RESP={
//     formatBulkingString:(str){
//         if(str===null) return "$-1\r\n";
//         return `$${Buffer.byteLength(str)}\r\n${str}\r\n`;
//     },
//     formatError(msg)
//     {
//         return `-ERR ${msg}\r\n`;
//     }
// }

// function parseArgs(argv) {
//     const args = {};
//     for (let i = 0; i < argv.length; i++) {
//         if (argv[i].startsWith('--')) {
//             const key = argv[i].slice(2);
//             const value = argv[i + 1];
//             if (value && !value.startsWith('--')) {
//                 args[key] = value;
//                 i++; // Skip the next argument since it's the value for the flag
//             }
//         }
//     }
//     return args;
// }

// // Parse command-line arguments
// const args = parseArgs(process.argv);

// // Get directory and filename from parsed arguments or use defaults
// const dir = args.dir || '/tmp/redis-test-files';
// const dbfilename = args.dbfilename || 'dump.rdb';

// const filePath = path.join(dir, dbfilename);
// const keys = parseRDBFile(filePath);

// // RESP Protocol Parser
// const parseRESP = (buffer) => {
//     let offset = 0;
//     const commands = [];
    
//     while (offset < buffer.length) {
//         const type = buffer[offset++];
        
//         switch (type) {
//             case 42: // '*' - Array
//                 const numArgs = parseInt(readUntilCRLF(buffer, offset));
//                 offset += getOffsetToCRLF(buffer, offset) + 2;
                
//                 const args = [];
//                 for (let i = 0; i < numArgs; i++) {
//                     if (buffer[offset++] !== 36) {
//                         throw new Error('Invalid RESP format: expected $ for bulk string');
//                     }
                    
//                     const strLen = parseInt(readUntilCRLF(buffer, offset));
//                     offset += getOffsetToCRLF(buffer, offset) + 2;
                    
//                     const str = buffer.slice(offset, offset + strLen).toString();
//                     offset += strLen + 2;
//                     args.push(str);
//                 }
//                 commands.push(args);
//                 break;
                
//             case 43: // '+' - Simple String
//             case 45: // '-' - Error
//             case 58: // ':' - Integer
//                 const value = readUntilCRLF(buffer, offset);
//                 offset += getOffsetToCRLF(buffer, offset) + 2;
//                 commands.push([value]);
//                 break;
                
//             case 36: // '$' - Bulk String
//                 const length = parseInt(readUntilCRLF(buffer, offset));
//                 offset += getOffsetToCRLF(buffer, offset) + 2;
//                 if (length === -1) {
//                     commands.push([null]);
//                 } else {
//                     const str = buffer.slice(offset, offset + length).toString();
//                     offset += length + 2;
//                     commands.push([str]);
//                 }
//                 break;
//         }
//     }
//     return commands;
// };

// function readUntilCRLF(buffer, offset) {
//     let end = offset;
//     while (end < buffer.length && buffer[end] !== 13) {
//         end++;
//     }
//     return buffer.slice(offset, end).toString();
// }

// function getOffsetToCRLF(buffer, offset) {
//     let end = offset;
//     while (end < buffer.length && buffer[end] !== 13) {
//         end++;
//     }
//     return end - offset;
// }

// const server = net.createServer((connection) => { //  new tcp server
// //    Handle connection
// const myMap=new Map();
// //keys.forEach((key) => myMap.set(key, { value: "dummy-value",expiryTime:null }));
// try {
// const keyValueMap = parseRDBFile(filePath);
// if(!keyValueMap)
// {
//     console.error('Error parsing RDB file:', err);
//     process.exit(1);
// }
// keyValueMap.forEach((value, key) => {
//     myMap.set(key, { value: value, expiryTime: null });

// });
// } catch (err) {
// console.error('Error parsing RDB file:', err);
// process.exit(1);
// }

// connection.on('data',(data)=>{ // handeling incoming data
    

//     try{
//         const commands=parseRESP(data);

//         for(const command of commands)
//         {
//             const [cmd, ...args]=command;

//             switch(cmd.toUpperCase())
//             {
//                 case 'PING':
//                     connection.write('+PONG\r\n');
//                     break;
                    
//                 case 'ECHO':
//                     if(args[0])
//                     {
//                         connection.write(`$${args[0].length}\r\n${args[0]}\r\n`);   

//                     }
//                     else{
//                         connection.write('-Error: Missing argument for ECHO\r\n');
//                     }
//                     break;
                
//                 case 'SET':
//                     let key = args[0];
//                     let value = args[1];
//                     let expiry=null;    

//                     for(let i=2;i<args.length;i++)
//                     {
//                         if(args[i])
//                         {
//                             if(args[i].toUpperCase()==='EX')
//                             {
//                                 expiry=parseInt(args[i+1],10)*1000;
//                             }
//                             else if(args[i].toUpperCase()==='PX')
//                             {
//                                 expiry=parseInt(args[i+1],10);
//                             }
//                         }
//                     }

//                     myMap.set(key,{
                        
//                             value:value,
//                             expiryTime:expiry?Date.now()+expiry:null
                        
//                         });
//                         connection.write('+OK\r\n');
//                         break;

//                     case 'GET':
//                         //let key = args[0];
//                         if(!args[0])
//                         {
//                             connection.write(RESP.formatError('wrong number of arguments for GET command'));
//                             break;
//                         }
//                         const keyData=myMap.get(args[0]);
//                         if(keyData)
//                         {
//                             if(keyData.expiryTime && Date.now()>keyData.expiryTime)
//                             {
//                                 myMap.delete(args[0]);
//                                 // connection.write('$-1\r\n');
//                                 connection.write(RESP.formatBulkString(null));
//                                 break;
//                             }
//                             else
//                             {
//                                 connection.write(`$${keyData.value.length}\r\n${keyData.value}\r\n`);
//                             }
                            
//                         }
//                         else{
//                             connection.write('$-1\r\n');
//                         }
//                         break;

//                         case 'KEYS':
//                             if (args[0] === '*') 
//                             {
//                                 const validKeys = [...myMap.entries()]
//                                     .filter(([_, value]) => !value.expiryTime || value.expiryTime > Date.now())
//                                     .map(([key, _]) => key);
                                    
//                                 const resp = `*${validKeys.length}\r\n` + 
//                                     validKeys.map(key => `$${Buffer.byteLength(key, "utf-8")}\r\n${key}\r\n`).join("");
//                                 connection.write(resp);
//                             }
//                             break;

//                             case 'CONFIG':
//                         if (args[0] === 'GET') 
//                             {
//                             const parameter = args[1];
//                             if (parameter === 'dir') {
//                                 connection.write(`*2\r\n$3\r\ndir\r\n$${dir.length}\r\n${dir}\r\n`);
//                             } else if (parameter === 'dbfilename') {
//                                 connection.write(`*2\r\n$10\r\ndbfilename\r\n$${dbfilename.length}\r\n${dbfilename}\r\n`);
//                             } else {
//                                 connection.write('$-1\r\n');
//                             }
//                         }
//                         break;
//                         default:
//                         connection.write('-ERR unknown command\r\n');
//                     }
//                 }
//             } catch (error) {
//                 console.error('Error processing command:', error);
//                 connection.write('-ERR internal server error\r\n');
//             }
//         });
    
//         connection.on('error', (err) => {
//             console.error('Connection error:', err);
//         });
// connection.on("end",()=>console.log("Client disconnected")); // connection is  asocket class which represent the connection between the server and client
// });

//  server.listen(6379, "127.0.0.1");

// //  git add .
// // git commit --allow-empty -m "[any message]"
// // git push origin mast





const net = require('net');
const { parseRDBFile } = require('./rdbParser');
const path = require('path');

let rdbFilePath = '';
let keyValueMap = null;

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    let dir = '.';
    let dbfilename = '';

    for (let i = 0; i < args.length; i += 2) {
        if (args[i] === '--dir') {
            dir = args[i + 1];
        } else if (args[i] === '--dbfilename') {
            dbfilename = args[i + 1];
        }
    }

    if (!dbfilename) {
        console.error('Missing required --dbfilename argument');
        process.exit(1);
    }

    return path.join(dir, dbfilename);
}

// Format response in RESP protocol format
function formatRespString(value) {
    if (value === null || value === undefined) {
        return "$-1\r\n";  // Null bulk string
    }
    return `$${value.length}\r\n${value}\r\n`;
}

// Handle client commands
function handleCommand(data, socket) {
    const command = data.toString().trim();
    const parts = command.split(' ');
    
    if (parts[0].toUpperCase() === 'GET') {
        const key = parts[1].replace(/"/g, '');  // Remove quotes if present
        const value = keyValueMap.get(key);
        socket.write(formatRespString(value));
    } else {
        socket.write("-ERR unknown command\r\n");
    }
}

// Create and start the server
function startServer() {
    // Parse command line arguments and get RDB file path
    rdbFilePath = parseArgs();
    
    // Load and parse the RDB file
    try {
        keyValueMap = parseRDBFile(rdbFilePath);
    } catch (err) {
        console.error('Failed to parse RDB file:', err);
        process.exit(1);
    }

    // Create TCP server
    const server = net.createServer((socket) => {
        console.log('Client connected');

        socket.on('data', (data) => {
            handleCommand(data, socket);
        });

        socket.on('error', (err) => {
            console.error('Socket error:', err);
        });

        socket.on('end', () => {
            console.log('Client disconnected');
        });
    });

    // Start listening on port 6379 (default Redis port)
    const PORT = 6379;
    server.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });

    server.on('error', (err) => {
        console.error('Server error:', err);
        process.exit(1);
    });
}

// Start the server
startServer();