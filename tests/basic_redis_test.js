var expect = require("chai").expect;
var Studio = require('studio');
var cluster = require('../src');

var rpcPort = 10131;
Studio.use(cluster({
    rpcPort:rpcPort,
    publisher:cluster.publisher.redis(rpcPort, '127.0.0.1',{getIp:function(){
        return '127.0.0.1';
    }})
}));

Studio = Studio.module('basic_redis');

describe("Basic Tests Redis Local",function(){
    this.timeout(5000);
    var receiver = Studio('receiver');
    it("must run without error",function(){
        return Studio.promise.delay(1200).then(function(){
          return receiver();
        }).then(function(result){
            expect(result).to.equal('HELLO');
        });
    });
});
