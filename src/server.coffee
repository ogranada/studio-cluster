dgram = require 'dgram'

client = dgram.createSocket({type:'udp4',reuseAddr:true})
started = null

module.exports = {
  start : (Studio,broadcastPort) ->
    if not started
      started = new Studio.Promise((resolve, reject)->
        client.bind({port: broadcastPort,exclusive: false},()->
          client.setBroadcast true
          resolve(client)
        )
        client.on("error", (err) ->
          console.log(err)
          client.close()
          reject()
        )
      )
    started
}