const net = require("net");

// You can use print statements as follows for debugging, they'll be visible when running tests.
//console.log("Logs from your program will appear here!");
const server = net.createServer((connection) => {
// Handle connection\
connection.write(`+PONG\r\n`);
  });
// Uncomment this block to pass the first stage
// const server = net.createServer((connection) => {
//   // Handle connection
// });
//
 server.listen(6379, "127.0.0.1");


//  git add .
// git commit --allow-empty -m "[any message]"
// git push origin master