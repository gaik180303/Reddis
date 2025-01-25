const net = require("net"); // for creating the tcp server

// You can use print statements as follows for debugging, they'll be visible when running tests.
//console.log("Logs from your program will appear here!");
//const server = net.createServer((connection) => {
// Handle connection\
// connection.write(`+PONG\r\n`);
//   });
// Uncomment this block to pass the first stage
const server = net.createServer((connection) => { //  new tcp server
//    Handle connection
const myMap=new Map();
connection.on('data',(data)=>{ // handeling incoming data
    const commands = Buffer.from(data).toString().split("\r\n"); //Clients send data in the RESP (Redis Serialization Protocol) format, where commands are delimited by \r\n.
    //Splits the string into an array of commands, where each command is separated by \r\n (carriage return and newline).
    
    

    for(let i=0;i<commands.length;i++)
    {
        const command=commands[i].toUpperCase();
        if(command==='PING')
        {
            connection.write('+PONG\r\n');
        }
        else if(command==='ECHO')
        {
            const argi=commands[i+2];
            if(argi)
            {
               // const resp=`$${argi.length}\r\n${argi}\r\n`;
               connection.write(`$${argi.length}\r\n${argi}\r\n`);
                //i++;
            }
           
            else{
                connection.write('-Error: Missing argument for ECHO\r\n');
            }
            //i++;

        }
        else if(command==='SET')
            {
                let expiry=null;
                expiry=parseInt(commands[i+6],10);
                
                myMap.set(commands[i+2],{value: commands[i+4], expiryTime:expiry?Date.now()+expiry:null});
                connection.write('+OK\r\n');
                i++;
            }
        else if(command==='GET')
            {
                const str=myMap.get(commands[i+2]);
                if(str)
                {
                    if(str.expiryTime && Date.now()>str.expiryTime)
                    {
                        myMap.delete(commands[i+2]);
                        connection.write('$-1\r\n');
                    }
                    else{
                        connection.write(`$${str.value.length}\r\n${str.value}\r\n`);
                    }
                }
                else {
                    connection.write("$-1\r\n");  // nil response in Redis protocol
                  }
                
            }
    }
    
   

});
connection.on("end",()=>console.log("Client disconnected")); // connection is  asocket class which represent the connection between the server and client
});

 server.listen(6379, "127.0.0.1");


//  git add .
// git commit --allow-empty -m "[any message]"
// git push origin master