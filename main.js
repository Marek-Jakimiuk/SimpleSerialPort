/*

    Created by Marek Jakimiuk 2017

*/


// Requires
var app = require('http').createServer(handler),
    io = require('socket.io').listen(app),
    fs = require('fs'),
    os = require('os'),
    sp = require('serialport');




// Initial SerialPort
var SerialPort = sp;

SerialPort.list(function (err, ports) {
    ports.forEach(function(port) {
        console.log(port.comName);
    });
});

var SerialHardwarePort = 'COM3';
var serialPort = new SerialPort(SerialHardwarePort,
    {   baudrate: 9600,
        dataBits: 8,
        parity: 'none',
        stopBits: 1,
        flowControl: false
    });




var networkInterfaces=os.networkInterfaces();
var stan;
var relay;

app.listen(9000);

serialPort.on('open', function() {
    console.log("\n" + 'SUCCES!' + "\n" + 'Serialport has been connected to port ' + SerialHardwarePort)
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
        socket.emit('your id', { id: socket.id });

        io.sockets.emit('on connection', { client: socket.id, clientCount: io.sockets.clients().length});

        socket.emit('ack button status', { status: stan, whichOne: relay });

        socket.on('button update event', function (data) {
            if(data.status == 'CheckConnect'){

                if(serialPort.isOpen()===true){console.log("Server is connected.")}
                else{console.log("Server is disconnected.")};

            }
            if(serialPort.isOpen() == true){
                serialPort.write(data.whichOne+data.status+'\n');
                if(data.status == 'Disconnect') {
                    if (serialPort.isOpen() == true) {
                        serialPort.close();
                        console.log('Disconected from serial-port.');
                    }}



            }
            else if(serialPort.isOpen() == false){
                if(data.status == 'Connect'){
                    serialPort.open();
                    console.log('Connected to serial-port.')
                }
            }
            io.sockets.emit('ack button status',data);
        });

        // Function while user left SimpleSerialPort
        socket.on('disconnect', function () {
            io.sockets.emit('on disconnect', { client: socket.id, clientCount: io.sockets.clients().length-1});
        });
});