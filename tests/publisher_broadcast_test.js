var expect = require("chai").expect;
var Studio = require('studio');
var path = require('path');
var broadcast = require('../src').publisher.broadcast;
broadcast.start(Studio, {rpcPort:9998});
var otherBroadcast;
var START_SERVICE_MESSAGE = require('../src/constants').START_SERVICE_MESSAGE;
var STOP_SERVICE_MESSAGE = require('../src/constants').STOP_SERVICE_MESSAGE;
var DISCOVER_SERVICES_MESSAGE = require('../src/constants').DISCOVER_SERVICES_MESSAGE;

describe("Broadcast publisher",function(){
    it("must define start and sendMessage functions",function(){
        expect(typeof broadcast.start).to.equal('function');
        expect(typeof broadcast.sendMessage).to.equal('function');
    });
    it("must be an EventEmitter",function(){
        expect(broadcast).to.be.an.instanceof(require("events").EventEmitter);
    });
    it("must returns a promise on start",function(){
        var started = broadcast.start(Studio);
        expect(typeof started.then).to.equal('function');
        expect(typeof started.catch).to.equal('function');
        return started;
    });
    it("must be able to send START_SERVICE_MESSAGE",function(){
        return broadcast.sendMessage(START_SERVICE_MESSAGE,'');
    });
    it("must be able to send STOP_SERVICE_MESSAGE",function(){
        return broadcast.sendMessage(STOP_SERVICE_MESSAGE,'');
    });
    it("must be able to send DISCOVER_SERVICES_MESSAGE",function(){
        return broadcast.sendMessage(DISCOVER_SERVICES_MESSAGE,'');
    });
    it("must be able to receive START_SERVICE_MESSAGE",function(){
        delete require.cache[path.join(__dirname,'../src/publisher/broadcast/index.js')];
        delete require.cache[path.join(__dirname,'../src/publisher/broadcast/server.js')];
        delete require.cache[path.join(__dirname,'../src/index.js')];
        otherBroadcast = require('../src').publisher.broadcast;
        return otherBroadcast.start(Studio,{rpcPort:9999}).then(function(){
            broadcast.sendMessage(START_SERVICE_MESSAGE,'foo');
            return new Studio.promise(function(resolve,reject){
                otherBroadcast.on("error",reject);
                otherBroadcast.on(START_SERVICE_MESSAGE,function(msg){
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
        broadcast.sendMessage(STOP_SERVICE_MESSAGE,'foo');
        return new Studio.promise(function(resolve,reject){
            otherBroadcast.on("error",reject);
            otherBroadcast.on(STOP_SERVICE_MESSAGE,function(msg){
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
        broadcast.sendMessage(DISCOVER_SERVICES_MESSAGE,'foo');
        return new Studio.promise(function(resolve,reject){
            otherBroadcast.on("error",reject);
            otherBroadcast.on(DISCOVER_SERVICES_MESSAGE,function(msg){
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
