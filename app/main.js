const net = require("net");
const os = require("os");
const path = require("path");

// const dir = process.argv[2] || '/tmp/redis-test-files';
// const dbfilename = process.argv[3] || 'dump.rdb';

const server = net.createServer((connection) => { //  new tcp server
//    Handle connection
const myMap=new Map();
connection.on('data',(data)=>{ // handeling incoming data
    const commands = Buffer.from(data).toString().split("\r\n"); //Clients send data in the RESP (Redis Serialization Protocol) format, where commands are delimited by \r\n.
    //Splits the string into an array of commands, where each command is separated by \r\n (carriage return and newline).
    const [,, dir, path, dbfilename, file] = process.argv;
		console.log([dir, path, dbfilename, file]);
    

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
                expiry=parseInt(commands[i+8],10);
                
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
                else 
                {
                    connection.write("$-1\r\n");  // nil response in Redis protocol
                  }
                
            }
            else if(command==='CONFIG' && commands[i+2]==='GET')
            {
                if(commands[i+4]==='dir')
                {
                    //const val=dir;
                    const response = `*2\r\n$3\r\ndir\r\n$${dir.length}\r\n${dir}\r\n`;
                    connection.write(response);
                }
                else if(commands[i+4]==='dbfilename')
                {
                    //const val=dbfilename;
                    const response = `*2\r\n$10\r\ndbfilename\r\n$${dbfilename.length}\r\n${dbfilename}\r\n`;
                    connection.write(response);
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