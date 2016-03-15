var server = require('./server');
var localServices = require('./localServices');
var remoteServices = require('./remoteServices');
var defaultTransport = require('./wsTransport');

var BROADCAST_IP = "255.255.255.255";
var START_SERVICE_MESSAGE = "START";
var STOP_SERVICE_MESSAGE = "STOP";
var DISCOVER_SERVICES_MESSAGE = "DISCOVER";

var registerRemoteService = function(rpcPort,broadcastPort,server){
    server.on("message",function(msg,rinfo){
        try{
            msg = JSON.parse(msg);
            if(msg.address !=="0.0.0.0" || msg.port !== rpcPort){ //localhost
                switch (msg.action){
                    case START_SERVICE_MESSAGE:
                        if(!(msg.id instanceof Array)){
                            msg.id = [msg.id];
                        }
                        msg.id.forEach(function(_id){
                            remoteServices[_id] = remoteServices[_id] || [];
                            remoteServices[_id].push({url:msg.address,port:msg.port});
                        });
                        break;
                    case STOP_SERVICE_MESSAGE:
                        if(!(msg.id instanceof Array)){
                            msg.id = [msg.id];
                        }
                        msg.id.forEach(function(_id){
                            remoteServices[_id] = remoteServices[_id] || [];
                            remoteServices[_id]=remoteServices[_id].filter(function(info){
                                return info.url !== msg.address && info.port !== msg.port;
                            });
                        });
                        break;
                    case DISCOVER_SERVICES_MESSAGE:
                        sendDiscoverResponse(rpcPort,broadcastPort,server);
                        break;
                }
            }
        }catch(err){
            console.error(err);
        }
    });
};

var removeServices = function(url,port){
    var k;
    var filterByUrlAndPort = function(info){
        return info.url !== url && info.port !== port;
    };
    for(k in remoteServices){
        remoteServices[k] = remoteServices[k].filter(filterByUrlAndPort);
    }
};

var sendDiscoverResponse = function(rpcPort,broadcastPort,server){
    var address = server.address();
    var ids = Object.keys(localServices).filter(function(id){return localServices[id];});

    var message = JSON.stringify({
        address : address.address,
        port : rpcPort,
        id : ids,
        action : START_SERVICE_MESSAGE
    });
    server.send(message,0,message.length, broadcastPort, BROADCAST_IP);
};

var sendMessage =function(action,rpcPort,broadcastPort,id,server){
    var address = server.address();
    var message = JSON.stringify({
        address : address.address,
        port : rpcPort,
        id : id,
        action : action
    });
    server.send(message,0,message.length, broadcastPort, BROADCAST_IP);
};

module.exports = function(configuration){
    return function(opt,Studio){
        configuration = configuration || {};
        var rpcPort = configuration.rpcPort || 10120;
        var broadcastPort = configuration.broadcastPort || 10121;
        var startPromise = server.start(Studio,broadcastPort);
        startPromise.then(registerRemoteService.bind(this,rpcPort,broadcastPort));
        startPromise.then(function(server){
            defaultTransport.start(Studio,rpcPort);
        });
        startPromise.then(function(){
            defaultTransport.onDisconnect(removeServices);
        });
        startPromise.then(sendMessage.bind(this,DISCOVER_SERVICES_MESSAGE,rpcPort,broadcastPort,null));
        opt.onStart(function(serv){
            localServices[serv.id] = true;
            startPromise.then(sendMessage.bind(this,START_SERVICE_MESSAGE,rpcPort,broadcastPort,serv.id));
        });
        opt.onStop(function(serv){
            localServices[serv.id] = false;
            startPromise.then(sendMessage.bind(this,STOP_SERVICE_MESSAGE,rpcPort,broadcastPort,serv.id));
        });
        opt.interceptSend(function(send,rec){
            return function(){
                var idx;
                if(localServices[rec] || !remoteServices[rec] || remoteServices[rec].length === 0 ){
                    return send.apply(this,arguments);
                }else{
                    idx = Math.floor(Math.random() * remoteServices[rec].length);
                    return defaultTransport.send(Studio,
                        remoteServices[rec][idx].url,
                        remoteServices[rec][idx].port,
                        Array.prototype.slice.call(arguments),
                        rec
                    );
                }
            };
        });
    };
};
