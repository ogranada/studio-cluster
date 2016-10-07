var expect = require("chai").expect;
var Studio = require('studio');
var redisPromise = require('../src').publisher.redis(9996,'localhost',{getIp:function(){
    return '127.0.0.1';
}})('123456', Studio);
var redis;
var otherRedis;
var START_SERVICE_MESSAGE = require('../src/constants').START_SERVICE_MESSAGE;
var STOP_SERVICE_MESSAGE = require('../src/constants').STOP_SERVICE_MESSAGE;
var DISCOVER_SERVICES_MESSAGE = require('../src/constants').DISCOVER_SERVICES_MESSAGE;
var SYNC_SERVICE_MESSAGE = require('../src/constants').SYNC_SERVICE_MESSAGE;

describe("Redis publisher",function(){
    it("must returns a promise on execution",function(){
        expect(typeof redisPromise.then).to.equal('function');
        expect(typeof redisPromise.catch).to.equal('function');
    });
    it("must define send function",function(){
        return redisPromise.then(function(_redis){
            redis = _redis;
            expect(typeof redis.send).to.equal('function');
        });
    });
    it("must be an EventEmitter",function(){
        expect(redis).to.be.an.instanceof(require("events").EventEmitter);
    });
    
    it("must be able to send START_SERVICE_MESSAGE",function(){
        redis.send(START_SERVICE_MESSAGE,'');
    });
    it("must be able to send STOP_SERVICE_MESSAGE",function(){
        redis.send(STOP_SERVICE_MESSAGE,'');
    });
    it("must be able to send DISCOVER_SERVICES_MESSAGE",function(){
        redis.send(DISCOVER_SERVICES_MESSAGE,'');
    });
    it("must be able to send SYNC_SERVICE_MESSAGE",function(){
        redis.send(SYNC_SERVICE_MESSAGE,'');
    });
    it("must be able to receive START_SERVICE_MESSAGE",function(){
        return require('../src').publisher.redis(9997,'localhost',{getIp:function(){
            return '127.0.0.1';
        }})('654321', Studio).then(function(_otherRedis){
            otherRedis = _otherRedis;
            redis.send(START_SERVICE_MESSAGE,'foo');
            return new Studio.promise(function(resolve,reject){
                otherRedis.on("error",reject);
                otherRedis.on(START_SERVICE_MESSAGE,function(msg){
                    try {
                        expect(msg.id).to.equal('foo');
                        expect(msg.action).to.equal(START_SERVICE_MESSAGE);
                        resolve();
                    }catch(err){
                        reject(err);
                    }
                });
            });
        });
    });
    it("must be able to receive STOP_SERVICE_MESSAGE",function(){
        redis.send(STOP_SERVICE_MESSAGE,'foo');
        return new Studio.promise(function(resolve,reject){
            otherRedis.on("error",reject);
            otherRedis.on(STOP_SERVICE_MESSAGE,function(msg){
                try{
                    expect(msg.id).to.equal('foo');
                    expect(msg.action).to.equal(STOP_SERVICE_MESSAGE);
                    resolve();
                }catch(err){
                    reject(err);
                }
            });
        });
    });
    it("must be able to receive DISCOVER_SERVICES_MESSAGE",function(){
        redis.send(DISCOVER_SERVICES_MESSAGE,'foo');
        return new Studio.promise(function(resolve,reject){
            otherRedis.on("error",reject);
            otherRedis.on(DISCOVER_SERVICES_MESSAGE,function(msg){
                try{
                    expect(msg.id).to.equal('foo');
                    expect(msg.action).to.equal(DISCOVER_SERVICES_MESSAGE);
                    resolve();
                }catch(err){
                    reject(err);
                }
            });
        });
    });
    it("must be able to receive SYNC_SERVICE_MESSAGE",function(){
        redis.send(SYNC_SERVICE_MESSAGE,'foo');
        return new Studio.promise(function(resolve,reject){
            otherRedis.on("error",reject);
            otherRedis.on(SYNC_SERVICE_MESSAGE,function(msg){
                try{
                    expect(msg.id).to.equal('foo');
                    expect(msg.action).to.equal(SYNC_SERVICE_MESSAGE);
                    resolve();
                }catch(err){
                    reject(err);
                }
            });
        });
    });
});
