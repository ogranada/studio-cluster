expect = require("chai").expect
cluster = require '../src/index'
Studio = require 'studio'
exec = require('child_process').exec
require('source-map-support').install()
rpcPort = Math.floor(Math.random() *3000) + 9000
Studio.use(cluster(rpcPort))

_done =()->
Studio.actorFactory({
  meuId: (message)->
    self = @
    setInterval(()->
      self.send('remoteActor', message).then((result)->
        _done(result)
      ).catch(()->)
    ,200)
})

describe("Test",()->
  it("must pass",(done)->
    message = 'hello'
    Studio.router.send(null, 'meuId',message).then(()->
      child = exec('node ./test/testOfRemoteActor.js')
      _done = (result)->
        expect(message).to.equal(result)
        child.kill('SIGHUP')
        done()
    )
  )
)
