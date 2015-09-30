dgram = require 'dgram'
#client = dgram.createSocket('udp4')
client = dgram.createSocket({type:'udp4',reuseAddr:true})
started = null
###
_onMessage = (msg, rinfo) -> #console.log("server got: #{msg} from #{rinfo.address}:#{rinfo.port}")

client.on("message",->_onMessage)
  ###
###
client.on("listening", ()->
  address = client.address()
  console.log("server listening #{address.address}:#{address.port}")
)
  {port: broadcastPort,exclusive: false}
###
module.exports = {
  start : (Studio,broadcastPort) ->
    if not started
      started = new Studio.Promise((resolve, reject)->
        #client.bind(broadcastPort,()->
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