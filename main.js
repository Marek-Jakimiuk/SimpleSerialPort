

// Requires
var app = require('http').createServer(handler),
    io = require('socket.io').listen(app),
    fs = require('fs'),
    os = require('os'),
    sp = require('serialport');

// Initial SerialPort
var SerialPort = sp
var SerialHardwarePort = 'COM1';
var serialPort = new SerialPort(SerialHardwarePort,
    {   baudrate: 57600,
        dataBits: 8,
        parity: 'none',
        stopBits: 1,
        flowControl: false
    });


var networkInterfaces=os.networkInterfaces();
var commonStatus = 'ON';

app.listen(7080);


serialPort.on("open", function() {
    console.log("\n" + 'SUCCES!' + "\n" + 'Serialport has been connected to port')
});

//Display my IP

for(var interface in networkInterfaces) {
    networkInterfaces[interface].forEach(
        function(details){
            if (details.family=='IPv4'
                && details.internal==false) {
                console.log(interface, details.address);
            }
        });
}

function handler (req, res) {
    fs.readFile('index.html',
        function (err, data) {
            if (err) {
                res.writeHead(500);
                return res.end('Error loading index.html');
            }
            res.writeHead(200);
            res.end(data);
        });
}

io.sockets.on('connection', function (socket) {
    socket.emit('your id',
        { id: socket.id
        });

    io.sockets.emit('on connection',
        { client: socket.id, clientCount: io.sockets.clients().length,
        });

    socket.emit('ack button status', {
        status: commonStatus
    });

    socket.on('button update event', function (data) {
        //console.log(data.status);
        if(data.status == 'ON'){
            commonStatus = 'OFF';
            serialPort.write("LEDON\n");
        }
        else{
            commonStatus = 'ON';
            serialPort.write("LEDOFF\n");
        }

        io.sockets.emit('ack button status',
            { status: commonStatus,
                by: socket.id
            });
    });

    // Function while user left SimpleSerialPort
    socket.on('disconnect', function () {
        io.sockets.emit('on disconnect',
            { client: socket.id,
                clientCount: io.sockets.clients().length-1,
            });
    });
});