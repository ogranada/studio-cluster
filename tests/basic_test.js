var expect = require("chai").expect;
var Studio = require('studio');
var cluster = require('../src');

Studio.use(cluster());
Studio = Studio.module('basic');

describe("Basic Tests",function(){
    var receiver = Studio('receiver');
    var receiverWithError = Studio('receiverWithError');
    var sum = Studio('sum');
    Studio(function sender(){
        return receiver();
    });
    Studio(function senderWithError(){
        return receiverWithError();
    });
    Studio(function senderSum(a){
        return sum(1,2).then(function(res){
            return res + a;
        });
    });

    var senderService = Studio('sender');
    var senderWithErrorService = Studio('senderWithError');
    var senderSumService = Studio('senderSum');


    it("must run without error",function(){
        return Studio.promise.delay(1200).then(function(){
          return senderService();
        }).then(function(result){
            expect(result).to.equal('HELLO');
        });
    });

    it("must support throwing error",function(){
        return senderWithErrorService().then(function(){
            throw new Error('Wrong Error');
        }).catch(function(error){
            expect(error.message).to.equal('ERROR');
        });
    });

    it("must support parameters",function(){
        return senderSumService(3).then(function(result){
            expect(result).to.equal(6);
        });
    });
    it("must support dualCommunication",function(){
        return Studio('dualCommunication')(4).then(function(result){
            expect(result).to.equal(7);
        });
    });
});
