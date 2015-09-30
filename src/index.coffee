###
dgram = require 'dgram'
client = dgram.createSocket 'udp4'
console.log 'start'
client.bind(9000,()->
  message = 'hello world'
  client.setBroadcast true
  client.send(message, 0, message.length, 9000, "255.255.255.255", (err,bytes)->
    #TODO do something on error
  )
)

client.on("error", (err) ->
  #if err.code=='EADDRINUSE'
    #TODO do something
  console.log("server error:\n" + err.stack)
  client.close()
)

client.on("message",(msg, rinfo) ->console.log("server got: #{msg} from #{rinfo.address}:#{rinfo.port}"))

client.on("listening", ()->
  address = client.address()
  console.log("server listening #{address.address}:#{address.port}")
)
###

server = require './server'
localActors = require './localActors'
remoteActors = require './remoteActors'
defaultTransport = require './httpTransport'
createActorMessage = "CREATE"
destroyActorMessage = "DESTROY"
registerRemoteActor = (server) ->
  server.on("message",(msg, rinfo) ->
    try
      msg = JSON.parse(msg)
      #if msg.id isnt "0.0.0.0" #localhost
      remoteActors[msg.id] ?= []
      if msg.action is createActorMessage
        remoteActors[msg.id].push({url:msg.address,port:msg.port})
      if msg.action is destroyActorMessage
        remoteActors[msg.id]=remoteActors[msg.id].filter((info)->info.url != msg.address and info.port != msg.port)
      console.log("server got: #{JSON.stringify(msg)} from #{rinfo.address}:#{rinfo.port}")
    catch err
      ()->#DO nothing
  )

sendCreateActorMessage= (rpcPort,broadcastPort,actor,server)->
  address = server.address()
  message = JSON.stringify({
    address : address.address
    port : rpcPort
    id : actor.id
    action : createActorMessage
  })
  server.send(message,0,message.length, broadcastPort, "255.255.255.255")

sendDestroyActorMessage= (rpcPort,broadcastPort,actor,server)->
  address = server.address()
  message = JSON.stringify({
    address : address.address
    port : rpcPort
    id : actor.id
    action : destroyActorMessage
  })
  server.send(message,0,message.length, broadcastPort, "255.255.255.255")
module.exports =(rpcPort = 10120 , broadcastPort = 10121)->
  (opt,Studio)->
    startPromise = server.start(Studio,broadcastPort)
    startPromise.then(registerRemoteActor)
    startPromise.then((server)->defaultTransport.start(Studio,rpcPort))
    opt.listenTo.onCreateActor((actor)->
      localActors[actor.id] = true
      startPromise.then(sendCreateActorMessage.bind(@,rpcPort,broadcastPort,actor))
    )
    opt.listenTo.onDestroyActor((actor)->
      localActors[actor.id] = false
      startPromise.then(sendDestroyActorMessage.bind(@,rpcPort,broadcastPort,actor))
    )
    opt.interceptSend((send)->
      (sender,receiver,message,headers)->
        if localActors[receiver] or not remoteActors[receiver] or remoteActors[receiver].length == 0
          send(sender,receiver,message,headers)
        else
          idx = Math.floor(Math.random() * remoteActors[receiver].length)
          destination = remoteActors[receiver][idx]
          defaultTransport.send(Studio,destination.url,destination.port,{sender:sender,receiver:receiver,message:message,headers:headers})
    )