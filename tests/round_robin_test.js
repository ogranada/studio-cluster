var expect = require("chai").expect;
var Studio = require('studio');

describe("Round Robin Tests", function () {
    var roundRobinFactory = require('../src/balance/round-robin');
    var transportMock, callCounter;

    var localMap = {
        test: true,
        test3: true
    };

    var remoteMap = {
        test: [
            { url: 'test1', port: 1 },
            { url: 'test2', port: 2 },
            { url: 'test3', port: 3 }
        ],
        test2: [
            { url: 'test4', port: 4 },
            { url: 'test4', port: 5 }
        ]
    };

    beforeEach(function () {
        callCounter = [/* local */ 0, 0, 0, 0, /* test2 */0, 0];

        transportMock = {
            send: function (url, port, id, params, receiver) {
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
    });

    it("should send local if the route is not found", function () {
        var rr = roundRobinFactory({ percentLocal: 100 })(transportMock, Studio);

        rr.send(transportMock.localSend, 'test55', localMap, remoteMap, ['test']);

        expect(callCounter[0]).to.equal(1);
    });

    it("should send remote if route is not present locally - even if percentLocal is 100%", function () {
        var rr = roundRobinFactory({ percentLocal: 100 })(transportMock, Studio);

        for (var i = 0; i < 100; i++) {
            rr.send(transportMock.localSend, 'test2', localMap, remoteMap, ['test']);
        }

        expect(callCounter[4]).to.be.equal(50);
        expect(callCounter[5]).to.be.equal(50);
    });

    it("should send local if route is not available remotely - even if percentLocal is 0%", function () {
        var rr = roundRobinFactory({ percentLocal: 0 })(transportMock, Studio);

        for (var i = 0; i < 100; i++) {
            rr.send(transportMock.localSend, 'test3', localMap, remoteMap, ['test']);
        }

        expect(callCounter[0]).to.be.equal(100);
    });

    it("should honor local percent - 100%", function () {
        var rr = roundRobinFactory({ percentLocal: 100 })(transportMock, Studio);

        for (var i = 0; i < 100; i++) {
            rr.send(transportMock.localSend, 'test', localMap, remoteMap, ['test']);
        }

        expect(callCounter[0]).to.be.equal(100);
    });

    it("should honor local percent - 50%", function () {
        var rr = roundRobinFactory({ percentLocal: 50 })(transportMock, Studio);

        for (var i = 0; i < 1000; i++) {
            rr.send(transportMock.localSend, 'test', localMap, remoteMap, ['test']);
        }

        // Due to the unpredictable nature of Math.Random() there is a small chance that
        // your test might have a false negative here.  Try running the test again before
        // debugging further.
        expect(callCounter[0]).to.be.within(450, 550);
    });

    it("should honor local percent - 0%", function () {
        var rr = roundRobinFactory({ percentLocal: 0 })(transportMock, Studio);

        for (var i = 0; i < 100; i++) {
            rr.send(transportMock.localSend, 'test', localMap, remoteMap, ['test']);
        }

        expect(callCounter[0]).to.be.equal(0);
    });
    
    it("should honor always local", function () {
        var rr = roundRobinFactory({ alwaysLocal: ['test'] })(transportMock, Studio);

        for (var i = 0; i < 50; i++) {
            rr.send(transportMock.localSend, 'test', localMap, remoteMap, ['test']);
        }

        for (var j = 0; j < 50; j++) {
            rr.send(transportMock.localSend, 'test2', localMap, remoteMap, ['test']);
        }

        expect(callCounter[0]).to.be.equal(50);
        expect(callCounter[4]).to.be.equal(25);
        expect(callCounter[5]).to.be.equal(25);
    });

    it("should send both local and remote", function () {
        var rr = roundRobinFactory({ percentLocal: -1 })(transportMock, Studio);

        for (var i = 0; i < 100; i++) {
            rr.send(transportMock.localSend, 'test', localMap, remoteMap, ['test']);
        }

        expect(callCounter[0]).to.be.equal(25);
        expect(callCounter[1]).to.be.equal(25);
        expect(callCounter[2]).to.be.equal(25);
        expect(callCounter[3]).to.be.equal(25);
    });

    it("should distribute work evenly for remote-only routes", function () {
        var rr = roundRobinFactory({ alwaysLocal: ['test'] })(transportMock, Studio);

        for (var j = 0; j < 50; j++) {
            rr.send(transportMock.localSend, 'test2', localMap, remoteMap, ['test']);
        }

        expect(callCounter[0]).to.be.equal(0);
        expect(callCounter[4]).to.be.equal(25);
        expect(callCounter[5]).to.be.equal(25);
    });

    it("should support disconnects mid-sequence", function () {
        var rr = roundRobinFactory({ percentLocal: 0 })(transportMock, Studio);
        var rMap = {
            test: [
                { url: 'test1', port: 1 },
                { url: 'test2', port: 2 }
            ],
            test2: [
                { url: 'test4', port: 4 }
            ]
        };

        for (var i = 0; i < 100; i++) {
            if (i >= 30) {
                rr.send(transportMock.localSend, 'test', localMap, rMap, ['test']);
            } else {
                rr.send(transportMock.localSend, 'test', localMap, remoteMap, ['test']);
            }
        }

        expect(callCounter[0]).to.be.equal(0);
        expect(callCounter[1]).to.be.equal(45);
        expect(callCounter[2]).to.be.equal(45);
        expect(callCounter[3]).to.be.equal(10);
    });

    it("should support additions mid-sequence", function () {
        var rr = roundRobinFactory({ percentLocal: 0 })(transportMock, Studio);
        var rMap = {
            test: [
                { url: 'test1', port: 1 },
                { url: 'test2', port: 2 },
                { url: 'test3', port: 3 },
                { url: 'test4', port: 4 }
            ]
        };

        for (var i = 0; i < 100; i++) {
            if (i >= 30) {
                rr.send(transportMock.localSend, 'test', localMap, rMap, ['test']);
            } else {
                rr.send(transportMock.localSend, 'test', localMap, remoteMap, ['test']);
            }
        }

        expect(callCounter[0]).to.be.equal(0);
        expect(callCounter[1]).to.be.equal(28);
        expect(callCounter[2]).to.be.equal(28);
        expect(callCounter[3]).to.be.equal(27);
        expect(callCounter[4]).to.be.equal(17);
    });
});
