var dgram = require('dgram');
var client = dgram.createSocket({type:'udp4',reuseAddr:true});
var EventEmitter = require("events").EventEmitter;
var address = require('./localIp');

var started = null;
var broadcastPort=null;
var rpcPort=null;
var BROADCAST_IP = "255.255.255.255";


var broadcastEmitter = new EventEmitter();

var sendMessage =function(action,id,server){
    var message = JSON.stringify({
        address : address,
        port : rpcPort,
        id : id,
        action : action
    });
    server.send(message,0,message.length, broadcastPort, BROADCAST_IP);
};


broadcastEmitter.start = function (Studio, opt) {
    if (!started) {
        broadcastPort = opt.broadcastPort || 10121;
        rpcPort = opt.rpcPort;
        started = new Studio.promise(function (resolve, reject) {
            client.bind({port: broadcastPort, exclusive: false}, function () {
                client.setBroadcast(true);
                resolve(client);
            });
            client.on('error', function (error) {
                broadcastEmitter.emit("error",error);
                client.close();
                reject(error);
            });
            client.on("message",function(msg,rinfo){
                try{
                    msg = JSON.parse(msg);
                    if(msg.address !==address || msg.port !== rpcPort){ //localhost
                        broadcastEmitter.emit(msg.action,msg);
                    }
                }catch(err){
                    console.error(err);
                }
            });
        });
    }
    return started;
};

broadcastEmitter.sendMessage = function(action,info){
    return started.then(sendMessage.bind(null,action,info));
};
module.exports = broadcastEmitter;