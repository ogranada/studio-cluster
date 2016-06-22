var expect = require("chai").expect;
var Studio = require('studio');

var primus = require('../src').transport.primus(9000)('123456', Studio);

var Primus = require('primus');

var sendTestData;
var server = Primus.createServer(function connection(spark) {
    'use strict';

    spark.on('data', function(message) {
        sendTestData = message;
    });
}, {port:9001});
describe("Primus transport",function(){
    it("must define send function",function(){
        expect(typeof primus.send).to.equal('function');
    });
    it("must be an EventEmitter",function(){
        expect(primus).to.be.an.instanceof(require("events").EventEmitter);
    });

    it("must be able to send data",function(){
        //Catch to avoid unhandled rejectio after closing server in the next test
        primus.send('127.0.0.1',9001,'123456',['foo'],'bar').catch(function(){});
        return Studio.promise.delay(300).then(function(){
            var byPassLint= expect(sendTestData.i).to.exist;
            expect(sendTestData.p[0]).to.equal('foo');
            expect(sendTestData.r).to.equal('bar');
        });
    });
    it("must emit close and end on server end",function(){
        var closed,ended;
        primus.on('close',function(){closed=true;});
        primus.on('end',function(){ended=true;});
        server.end();
        return Studio.promise.delay(200).then(function(){
            expect(closed).to.equal(true);
            expect(ended).to.equal(true);
        });
    });

});
