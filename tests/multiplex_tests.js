var expect = require("chai").expect;
var Studio = require('studio');

describe("Multiplex Tests", function () {
    var multiplexFactory = require('../src/balance/multiplex');
    var transportMock, passThroughMock, callCounter, passThroughCounter;

    var localMap = {
        test: true
    };

    var remoteMap = {
        test: [
            { url: 'test1', port: 1 },
            { url: 'test2', port: 2 },
            { url: 'test3', port: 3 }
        ],
        test2: [
            { url: 'test4', port: 4 }
        ]
    };

    beforeEach(function () {
        callCounter = [/* local */ 0, 0, 0, 0, /* test2 */0];
        passThroughCounter = 0;

        transportMock = {
            send: function (url, port, params, receiver) {
                expect(params).to.include('test');

                callCounter[port] += 1;

                return true;
            },
            localSend: function () {
                expect(arguments[0]).to.equal('test');

                callCounter[0] += 1;

                return true;
            }
        };

        passThroughMock = {
            send: function (send, receive, localServices, remoteServices, payload) {
                expect(send).to.equal(transportMock.localSend);
                expect(receive).to.equal('test2');
                expect(localServices).to.equal(localMap);
                expect(remoteServices).to.equal(remoteServices);
                expect(payload).to.contain('test');

                passThroughCounter += 1;
                
                return true;
            }
        }
    });

    it("should multiplex local & remote routes", function () {
        var rr = multiplexFactory({ routes: ['test'], passThrough: passThroughMock })(transportMock, Studio);

        for (var i = 0; i < 100; i++) {
            rr.send(transportMock.localSend, 'test', localMap, remoteMap, ['test']);
        }

        expect(callCounter[0]).to.be.equal(100);
        expect(callCounter[1]).to.be.equal(100);
        expect(callCounter[2]).to.be.equal(100);
        expect(callCounter[3]).to.be.equal(100);
    });

    it("should passThrough routes that are not configured for multiplexing", function () {
        var rr = multiplexFactory({ routes: ['test'], passThrough: passThroughMock })(transportMock, Studio);

        for (var i = 0; i < 100; i++) {
            rr.send(transportMock.localSend, 'test2', localMap, remoteMap, ['test']);
        }

        expect(passThroughCounter).to.equal(100);
        expect(callCounter[0]).to.be.equal(0);
        expect(callCounter[1]).to.be.equal(0);
        expect(callCounter[2]).to.be.equal(0);
        expect(callCounter[3]).to.be.equal(0);
        expect(callCounter[4]).to.be.equal(0);
    });
});
