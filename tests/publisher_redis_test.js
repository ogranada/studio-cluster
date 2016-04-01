var expect = require("chai").expect;
var Studio = require('studio');
var path = require('path');
var redis = require('../src').publisher.redis;
var otherRedis;
var START_SERVICE_MESSAGE = require('../src/constants').START_SERVICE_MESSAGE;
var STOP_SERVICE_MESSAGE = require('../src/constants').STOP_SERVICE_MESSAGE;
var DISCOVER_SERVICES_MESSAGE = require('../src/constants').DISCOVER_SERVICES_MESSAGE;

describe("Redis publisher",function(){
    it("must define start and sendMessage functions",function(){
        expect(typeof redis.start).to.equal('function');
        expect(typeof redis.sendMessage).to.equal('function');
    });
    it("must be an EventEmitter",function(){
        expect(redis).to.be.an.instanceof(require("events").EventEmitter);
    });
    it("must returns a promise on start",function(){
        var started = redis.start(Studio,{
            redis:'localhost',
            rpcPort:9996
        });
        expect(typeof started.then).to.equal('function');
        expect(typeof started.catch).to.equal('function');
        return started;
    });
    it("must be able to send START_SERVICE_MESSAGE",function(){
        return redis.sendMessage(START_SERVICE_MESSAGE,'');
    });
    it("must be able to send STOP_SERVICE_MESSAGE",function(){
        return redis.sendMessage(STOP_SERVICE_MESSAGE,'');
    });
    it("must be able to send DISCOVER_SERVICES_MESSAGE",function(){
        return redis.sendMessage(DISCOVER_SERVICES_MESSAGE,'');
    });

    it("must be able to receive START_SERVICE_MESSAGE",function(){
        delete require.cache[path.join(__dirname,'../src/publisher/redis/index.js')];
        delete require.cache[path.join(__dirname,'../src/publisher/redis/server.js')];
        delete require.cache[path.join(__dirname,'../src/index.js')];
        otherRedis = require('../src').publisher.redis;
        return otherRedis.start(Studio,{
            redis:'localhost',
            rpcPort:9997
        }).then(function(){
            redis.sendMessage(START_SERVICE_MESSAGE,'foo');
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
        redis.sendMessage(STOP_SERVICE_MESSAGE,'foo');
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
        redis.sendMessage(DISCOVER_SERVICES_MESSAGE,'foo');
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
});
