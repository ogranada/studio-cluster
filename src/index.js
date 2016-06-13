var localServices = require('./localServices');
var remoteServices = require('./remoteServices');
var constants = require('./constants');
var util = require('./util');

var SYNC_SERVICE_MESSAGE = constants.SYNC_SERVICE_MESSAGE;
var START_SERVICE_MESSAGE = constants.START_SERVICE_MESSAGE;
var STOP_SERVICE_MESSAGE = constants.STOP_SERVICE_MESSAGE;
var DISCOVER_SERVICES_MESSAGE = constants.DISCOVER_SERVICES_MESSAGE;



var removeServices = function(url,port){
    var k;
    var filterByUrlAndPort = function(info){
        return info.url !== url || info.port !== port;
    };
    Object.keys(remoteServices).forEach(function(k){
        remoteServices[k] = remoteServices[k].filter(filterByUrlAndPort);
    });
    servicesByUrlPort[url+':'+port]=null;
};

var servicesByUrlPort={};

var startedPlugin = false;
var clusterPlugin = function(configuration){
    if(startedPlugin){
        return function noop(){};//Just make sure you dont run this plugin twice
    }else{
        startedPlugin = true;
        return function(serviceListener,Studio){
            var prioritizeLocal,rpcPort,syncInterval;
            configuration = configuration || {};
            rpcPort = configuration.rpcPort || 10120;
            syncInterval = (+configuration.syncInterval >0)? +configuration.syncInterval : 30*60*1000;
            prioritizeLocal = configuration.prioritizeLocal === false ? false : true;
            var startPromise = configuration.publisher || clusterPlugin.publisher.broadcast(rpcPort);
            var transport = configuration.transport || clusterPlugin.transport.primus(rpcPort);

            // NOTE: To maintain compatibility with the previous implementation, prioritizeLocal will send 100% of the traffic
            // to the local service be default.
            var balance = configuration.balance || clusterPlugin.balance.random({ percentLocal: prioritizeLocal ? 100 : -1});

            startPromise = startPromise(Studio);
            transport = transport(Studio);
            balance = balance(transport, Studio);

            startPromise.then(function(publisher){

                publisher.send(DISCOVER_SERVICES_MESSAGE);
                publisher.on(START_SERVICE_MESSAGE,function(msg){
                    var key;
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
                    key = msg.address+':'+msg.port;
                    servicesByUrlPort[key] = servicesByUrlPort[key] || [];
                    servicesByUrlPort[key] = msg.id.concat(servicesByUrlPort[key]);
                    servicesByUrlPort[key] = util.uniq(servicesByUrlPort[key]);
                });
                publisher.on(STOP_SERVICE_MESSAGE,function(msg){
                    var key;
                    if(!(msg.id instanceof Array)){
                        msg.id = [msg.id];
                    }
                    key = msg.address+':'+msg.port;
                    msg.id.forEach(function(_id){
                        remoteServices[_id] = remoteServices[_id] || [];
                        remoteServices[_id]=remoteServices[_id].filter(function(info){
                            return info.url !== msg.address || info.port !== msg.port;
                        });
                        servicesByUrlPort[key] = (servicesByUrlPort[key] || []).filter(function(v){
                            return v !== _id;
                        });
                    });
                });
                publisher.on(DISCOVER_SERVICES_MESSAGE,function(msg){
                    var ids = Object.keys(localServices).filter(function(id){return localServices[id];});
                    startPromise.then(function(){
                        publisher.send(START_SERVICE_MESSAGE,ids);
                    });
                });
                publisher.on(SYNC_SERVICE_MESSAGE,function(msg){
                    var key;
                    key = msg.address+':'+msg.port;
                    servicesByUrlPort[key] = msg.id;
                    Object.keys(remoteServices).forEach(function(_id){
                        remoteServices[_id] = remoteServices[_id].filter(function(info){
                            return info.url !== msg.address || info.port !== msg.port;
                        });
                    });
                    msg.id.forEach(function(_id){
                        remoteServices[_id].push({url:msg.address,port:msg.port});
                    });
                });
            });
            
            if(syncInterval){
                startPromise.then(function(publisher){
                    setInterval(function(){
                        var ids = Object.keys(localServices).filter(function(id){return localServices[id];});
                        publisher.send(SYNC_SERVICE_MESSAGE,ids);
                    },syncInterval);
                });    
            }
            
            serviceListener.onStart(function(serv){
                localServices[serv.id] = true;
                startPromise.then(function(publisher){
                    publisher.send(START_SERVICE_MESSAGE,serv.id);
                });
            });
            serviceListener.onStop(function(serv){
                localServices[serv.id] = false;
                startPromise.then(function(publisher){
                    publisher.send(STOP_SERVICE_MESSAGE,serv.id);
                });
            });
            transport.on('end',function(obj){
                removeServices(obj.url,obj.port);
            });
            transport.on('close',function(obj){
                var tmp = servicesByUrlPort[obj.url+':'+obj.port];
                removeServices(obj.url,obj.port);
                servicesByUrlPort[obj.url+':'+obj.port] = tmp;
            });
            transport.on('reconnected',function(obj){
                (servicesByUrlPort[obj.url+':'+obj.port] || []).forEach(function(_id){
                    remoteServices[_id] = remoteServices[_id] || [];
                    remoteServices[_id] = remoteServices[_id].filter(function(info){
                        return info.url !== obj.url || info.port !== obj.port;
                    });
                    remoteServices[_id].push({url:obj.url,port:obj.port});
                });
            });

            serviceListener.interceptSend(function(send,rec){
                return function() {
                    return balance.send(send, rec, localServices, remoteServices, Array.prototype.slice.call(arguments));
                };
            });
        };
    }
};

clusterPlugin.publisher={
  broadcast : require('./publisher/broadcast'),
  redis : require('./publisher/redis')
};
clusterPlugin.transport={
  primus : require('./transport/primus')
};
clusterPlugin.balance={
    random : require('./balance/random'),
    multiplex : require('./balance/multiplex'),
    roundRobin: require('./balance/round-robin')
};
module.exports = clusterPlugin;