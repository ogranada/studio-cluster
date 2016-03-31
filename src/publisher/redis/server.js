var EventEmitter = require("events").EventEmitter;
var publicIp = require('public-ip');
var Redis = require('ioredis');

var started = null;
var rpcPort=null;
var myIp = null;
var CHANNEL_NAME = '__studio_service_discovery';

var redisEmitter = new EventEmitter();

var sendMessage =function(action,id,redis){
    var message = JSON.stringify({
        address : myIp,
        port : rpcPort,
        id : id,
        action : action
    });
    redis.publish(CHANNEL_NAME,message);
};


redisEmitter.start = function (Studio, opt) {
    var redis;
    if (!started) {
        opt = opt || {};
        redisPublisher = new Redis(opt.redis);
        redisSender = new Redis(opt.redis);
        rpcPort = opt.rpcPort;
        started = new Studio.promise(function (resolve, reject) {
            redisPublisher.subscribe(CHANNEL_NAME,function(err){
                if(err){
                    return reject(err);
                }
                publicIp.v4(function (err, ip) {
                    if(err){
                        return reject(err);
                    }
                    myIp = ip;
                    resolve(redisSender);
                });
            });
            redisPublisher.on('error',reject);
            redisPublisher.on('message',function(channel,msg){
                try{
                    msg = JSON.parse(msg);
                    if(msg.address !== myIp || msg.port !== rpcPort){ //localhost
                        msg.address = myIp;
                        redisEmitter.emit(msg.action,msg);
                    }
                }catch(err){
                    // nothing to do... ignore message
                }
            });
        });
    }
    return started;
};

redisEmitter.sendMessage = function(action,info){
    return started.then(sendMessage.bind(null,action,info));
};
module.exports = redisEmitter;