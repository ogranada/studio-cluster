var expect = require("chai").expect;
var Studio = require('studio');
var cluster = require('../src');

Studio.use(cluster());
Studio = Studio.module('cancel');

describe("Cancel Tests",function(){
    var delayed = Studio('delayed');
    Studio(function sender(){
        return delayed(50);
    });
    var senderService = Studio('sender');

    it("must cancel immediately on kill",function(){
        return senderService().then(function(result){
            throw new Error('Wrong Error');
        }).catch(function(error){
            expect(error.message).to.equal('CLOSED');
        });
    });
});
