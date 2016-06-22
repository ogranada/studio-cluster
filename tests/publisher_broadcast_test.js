var expect = require("chai").expect;
var Studio = require('studio');
var broadcastPromise = require('../src').publisher.broadcast(10000)('123456', Studio);
var broadcast;
var otherBroadcast;
var START_SERVICE_MESSAGE = require('../src/constants').START_SERVICE_MESSAGE;
var STOP_SERVICE_MESSAGE = require('../src/constants').STOP_SERVICE_MESSAGE;
var DISCOVER_SERVICES_MESSAGE = require('../src/constants').DISCOVER_SERVICES_MESSAGE;
var SYNC_SERVICE_MESSAGE = require('../src/constants').SYNC_SERVICE_MESSAGE;

describe("Broadcast publisher",function(){
    it("must returns a promise on execution",function(){
        expect(typeof broadcastPromise.then).to.equal('function');
        expect(typeof broadcastPromise.catch).to.equal('function');
    });
    it("must define send function",function(){
        return broadcastPromise.then(function(_broadcast){
            broadcast = _broadcast;
            expect(typeof broadcast.send).to.equal('function');    
        });
    });
    it("must be an EventEmitter",function(){
        expect(broadcast).to.be.an.instanceof(require("events").EventEmitter);
    });
    it("must be able to send START_SERVICE_MESSAGE",function(){
        return broadcast.send(START_SERVICE_MESSAGE,'');
    });
    it("must be able to send STOP_SERVICE_MESSAGE",function(){
        return broadcast.send(STOP_SERVICE_MESSAGE,'');
    });
    it("must be able to send DISCOVER_SERVICES_MESSAGE",function(){
        return broadcast.send(DISCOVER_SERVICES_MESSAGE,'');
    });
    it("must be able to send SYNC_SERVICE_MESSAGE",function(){
        return broadcast.send(SYNC_SERVICE_MESSAGE,'');
    });
    it("must be able to receive START_SERVICE_MESSAGE",function(){
        var otherBroadcastPromise = require('../src').publisher.broadcast(9999)('654321', Studio);
        return otherBroadcastPromise.then(function(_otherBroadcast){
            otherBroadcast = _otherBroadcast;
            broadcast.send(START_SERVICE_MESSAGE,'foo');
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
        broadcast.send(STOP_SERVICE_MESSAGE,'foo');
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
        broadcast.send(DISCOVER_SERVICES_MESSAGE,'foo');
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
    it("must be able to receive SYNC_SERVICE_MESSAGE",function(){
        broadcast.send(SYNC_SERVICE_MESSAGE,['foo']);
        return new Studio.promise(function(resolve,reject){
            otherBroadcast.on("error",reject);
            otherBroadcast.on(SYNC_SERVICE_MESSAGE,function(msg){
                try{
                    expect(msg.id[0]).to.equal('foo');
                    expect(msg.action).to.equal(SYNC_SERVICE_MESSAGE);
                    resolve();
                }catch(err){
                    reject(err);
                }
            });
        });
    });
});
