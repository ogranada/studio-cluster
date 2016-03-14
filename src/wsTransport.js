var WebSocketServer = require('websocket').server;
var http = require('http');
var isListening = false;
var protocol = 'studio';
var WebSocketClient = require('websocket').client;
var uuid = require('node-uuid');
var server = http.createServer(function (request, response){
    response.writeHead(404);
    response.end();
});
var connections = {};

var generateId = function(){
    return uuid.v4();
};

var safeJsonParse = function (str){
    try {
        return JSON.parse(str);
    }catch(err){

    }
};

var _connect = function(Studio,url,port){
    var clientPromise;
    var _self = this;
    if(!connections[url+':'+port]){
        clientPromise = new Studio.promise(function(resolve,reject){
            var client = new WebSocketClient();
            client.on('connectFailed', function(error){
                connections[url+':'+port] = null;
                if(_self.disconnectFunction){
                    _self.disconnectFunction(url,port);
                }
                var timeout = (_self.__timeoutWS || 50) * 2;
                setTimeout(_connect.bind(_self,Studio,url,port),timeout);
            });
            client.on('connect', function (connection){
                connection.on('error', function(error){
                    connections[url+':'+port] = null;
                    if(_self.disconnectFunction){
                        _self.disconnectFunction(url,port);
                    }
                    var timeout = (_self.__timeoutWS || 50) * 2;
                    setTimeout(_connect.bind(_self,Studio,url,port),timeout);
                });
                connection.on('close', function(){
                    if(_self.disconnectFunction){
                        _self.disconnectFunction(url,port);
                    }
                });
                client.connection = connection;
                client.connection.on('message', function(message){
                    var funk;
                    var jsonMessage = safeJsonParse(message.utf8Data);
                    if(jsonMessage && jsonMessage.i && client._promises[jsonMessage.i]){
                        funk = jsonMessage.s ? client._promises[jsonMessage.i].resolve : client._promises[jsonMessage.i].reject;
                        funk(jsonMessage.m);
                    }
                });
                resolve(client);
            });
            client.connect("ws://"+url+":"+port+"/", protocol);
            client._promises={};
        });
        connections[url+':'+port] = clientPromise;
    }
    return connections[url+':'+port];
};
var refs = {};
module.exports = {
    start: function (Studio, rpcPort) {
        var wsServer;
        if(!isListening) {
            isListening = true;
            server.listen(rpcPort, function(){});
            wsServer = new WebSocketServer({httpServer: server,autoAcceptConnections: false});
            wsServer.on('request',function (request){
                var connection = request.accept(protocol, request.origin);
                connection.on('message', function(message){
                    message = safeJsonParse(message.utf8Data);
                    if(message.r){
                        refs[message.r] = refs[message.r] || Studio(message.r);
                        refs[message.r].apply(null,message.p).then(function(res){
                            connection.sendUTF(JSON.stringify({i:message.i, m:res,s:1}));
                        }).catch(function(err) {
                            connection.sendUTF(JSON.stringify({i: message.i, m: err, s: 0}));
                        });
                    }
                });
                connection.on('close', function(){});
            });

        }
    },
    send:function(Studio,url,port,params,receiver){
        _connect.call(this,Studio,url,port);
        return connections[url+':'+port].then(function(client){
            var id = generateId();
            var _resolve , _reject;
            var promise = new Promise(function(resolve,reject) {
                _resolve = resolve;
                _reject = reject;
            });
            client._promises[id] = {
                resolve: _resolve,
                reject:_reject
            };
            client.connection.sendUTF(JSON.stringify({i:id,p:params,r:receiver}));
            return promise;
        });
    },
    disconnectFunction:function(url,port){
        connections[url+':'+port] = null;
    },
    onDisconnect:function(funk) {
        var oldDisconnect = this.disconnectFunction;
        this.disconnectFunction = function (url,port){
            oldDisconnect(url,port);
            funk(url,port);
        };
    }
};
