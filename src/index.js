var localServices = require('./localServices');
var remoteServices = require('./remoteServices');
var defaultTransport = require('./wsTransport');
var constants = require('./constants');

var START_SERVICE_MESSAGE = constants.START_SERVICE_MESSAGE;
var STOP_SERVICE_MESSAGE = constants.STOP_SERVICE_MESSAGE;
var DISCOVER_SERVICES_MESSAGE = constants.DISCOVER_SERVICES_MESSAGE;



var removeServices = function(url,port){
    var k;
    var filterByUrlAndPort = function(info){
        return info.url !== url || info.port !== port;
    };
    for(k in remoteServices){
        remoteServices[k] = remoteServices[k].filter(filterByUrlAndPort);
    }
};



var clusterPlugin = function(configuration){
    return function(opt,Studio){
        configuration = configuration || {};
        configuration.rpcPort = configuration.rpcPort || 10120;
        var rpcPort = configuration.rpcPort;
        var publisher = configuration.publisher || clusterPlugin.publisher.broadcast;
        var startPromise = publisher.start(Studio,configuration);

        publisher.sendMessage(DISCOVER_SERVICES_MESSAGE);
        publisher.on(START_SERVICE_MESSAGE,function(msg){
            if(!(msg.id instanceof Array)){
                msg.id = [msg.id];
            }
            msg.id.forEach(function(_id){
                remoteServices[_id] = remoteServices[_id] || [];
                remoteServices[_id] = remoteServices[_id].filter(function(info){
                    return info.url !== msg.address || info.port !== msg.port;
                });
                remoteServices[_id].push({url:msg.address,port:msg.port});
            });
        });
        publisher.on(STOP_SERVICE_MESSAGE,function(msg){
            if(!(msg.id instanceof Array)){
                msg.id = [msg.id];
            }
            msg.id.forEach(function(_id){
                remoteServices[_id] = remoteServices[_id] || [];
                remoteServices[_id]=remoteServices[_id].filter(function(info){
                    return info.url !== msg.address || info.port !== msg.port;
                });
            });
        });
        publisher.on(DISCOVER_SERVICES_MESSAGE,function(msg){
            var ids = Object.keys(localServices).filter(function(id){return localServices[id];});
            publisher.sendMessage(START_SERVICE_MESSAGE,ids);
        });
        opt.onStart(function(serv){
            localServices[serv.id] = true;
            publisher.sendMessage(START_SERVICE_MESSAGE,serv.id);
        });
        opt.onStop(function(serv){
            localServices[serv.id] = false;
            publisher.sendMessage(STOP_SERVICE_MESSAGE,serv.id);
        });

        startPromise.then(function(server){
            defaultTransport.start(Studio,rpcPort);
        });
        startPromise.then(function(){
            defaultTransport.onDisconnect(removeServices);
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

clusterPlugin.publisher={
  broadcast : require('./publisher/broadcast'),
  redis : require('./publisher/redis')
};
module.exports = clusterPlugin;