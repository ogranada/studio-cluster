var dgram = require('dgram');
var client = dgram.createSocket({type:'udp4',reuseAddr:true});
var EventEmitter = require("events").EventEmitter;
var uuid = require('node-uuid');
var id = uuid.v4();

var started = null;
var broadcastPort=null;
var rpcPort=null;
var BROADCAST_IP = "255.255.255.255";

var broadcastEmitter = new EventEmitter();

var sendMessage =function(action,id,server){
    var message = JSON.stringify({
        port : rpcPort,
        id : id,
        action : action
    });
    server.send(message,0,message.length, broadcastPort, BROADCAST_IP);
};


broadcastEmitter.start = function (Studio, opt) {
    if (!started) {
        opt = opt || {};
        broadcastPort = opt.broadcastPort || 10121;
        rpcPort = opt.rpcPort;
        started = new Studio.promise(function (resolve, reject) {
            client.bind({port: broadcastPort, exclusive: false}, function () {
                client.setBroadcast(true);
                var strId = JSON.stringify(id);
                //broadcasting a msg with my id so i can discover my local ip address
                //more reliable than check each networkInterface
                client.send(strId,0,strId.length, broadcastPort, BROADCAST_IP);
            });
            client.on('error', function (error) {
                broadcastEmitter.emit("error",error);
                client.close();
                reject(error);
            });
            client.on("message",function(msg,rinfo){
                try{
                    msg = JSON.parse(msg);
                    if(msg ===id){
                        //receiving broadcast msg with my id now i know my address
                        address = rinfo.address;
                        resolve(client);
                    }else if(rinfo.address !==address || msg.port !== rpcPort){ //localhost
                        msg.address = rinfo.address;
                        broadcastEmitter.emit(msg.action,msg);
                    }
                }catch(err){
                    // nothing to do... ignore message
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