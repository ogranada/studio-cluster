var EventEmitter = require("events").EventEmitter;
var publicIp = require('public-ip');
var Redis = require('ioredis');
var util = require('util');
var uuid = require('node-uuid');


var redisSender,redisSubscriber,started = null;
var myIp = null;
var CHANNEL_NAME = '__studio_service_discovery';




var redisEmitter = new EventEmitter();



function StudioRedisEmitter(opt){
    this.id = uuid.v4();
    this.sender = opt.sender;
    this.rpcPort = opt.rpcPort;
    this.subscriber = opt.subscriber;
}
util.inherits(StudioRedisEmitter,EventEmitter);

StudioRedisEmitter.prototype.send = function(action,info){
    var message = JSON.stringify({
        _publisherId:this.id,
        address : myIp,
        port : this.rpcPort,
        id : info,
        action : action
    });
    redisSender.publish(CHANNEL_NAME,message);
};


module.exports = function (rpcPort, opt, forceLocal) {
    return function(Studio){
        var redis;
        opt = opt || {};
        redisSubscriber = new Redis(opt);
        redisSender = new Redis(opt);
        var instance = new StudioRedisEmitter({
            sender:redisSender,
            subscriber:redisSubscriber,
            rpcPort:rpcPort
        });
        return new Studio.promise(function (resolve, reject) {
            instance.subscriber.subscribe(CHANNEL_NAME,function(err){
                if(err){
                    return reject(err);
                }
                if(forceLocal){
                    myIp = '127.0.0.1';
                    resolve(instance);
                }else{
                    publicIp.v4(function (err, ip) {
                        if(err){
                            return reject(err);
                        }
                        myIp = ip;
                        resolve(instance);
                    });
                }
            });
            redisSubscriber.on('error',reject);
            redisSubscriber.on('message',function(channel,msg){
                try{
                    msg = JSON.parse(msg);
                    if(msg._publisherId !== instance.id){ //localhost
                        instance.emit(msg.action,msg);
                    }
                }catch(err){
                    // nothing to do... ignore message
                }
            });
        });
    };
};
