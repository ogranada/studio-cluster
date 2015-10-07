server = require './server'
localActors = require './localActors'
remoteActors = require './remoteActors'
defaultTransport = require './wsTransport'

BROADCAST_IP = "255.255.255.255"
createActorMessage = "CREATE"
destroyActorMessage = "DESTROY"
discoverActorMessage = "DISCOVER"

registerRemoteActor = (rpcPort,broadcastPort,server) ->
  server.on("message",(msg, rinfo) ->
    try
      msg = JSON.parse(msg)
      #if msg.id isnt "0.0.0.0" #localhost
      remoteActors[msg.id] ?= []
      if msg.action is createActorMessage
        if msg.id instanceof Array
          remoteActors[_id].push({url:msg.address,port:msg.port}) for _id in msg.id
        else
          remoteActors[msg.id].push({url:msg.address,port:msg.port})
      if msg.action is destroyActorMessage
        remoteActors[msg.id]=remoteActors[msg.id].filter((info)->info.url != msg.address and info.port != msg.port)
      if msg.action is discoverActorMessage
        console.log(discoverActorMessage)
        sendDiscoverResponse(rpcPort,broadcastPort,server)
    catch err
      ()->#DO nothing
  )

removeActors = (url,port) ->
  for k of remoteActors
    remoteActors[k] = remoteActors[k].filter((info)-> info.url!=url or info.port != port)

sendDiscoverResponse = (rpcPort,broadcastPort,server)->
  address = server.address()
  ids = []
  console.log(localActors)
  ids.push(id) for id of localActors when localActors[id]
  console.log(ids)
  message = JSON.stringify({
    address : address.address
    port : rpcPort
    id : ids
    action : createActorMessage
  })
  console.log(message)
  server.send(message,0,message.length, broadcastPort, BROADCAST_IP)
sendMessage =(action,rpcPort,broadcastPort,actor,server)->
  address = server.address()
  message = JSON.stringify({
    address : address.address
    port : rpcPort
    id : actor?.id
    action : action
  })
  server.send(message,0,message.length, broadcastPort, BROADCAST_IP)

module.exports =(rpcPort = 10120 , broadcastPort = 10121)->
  (opt,Studio)->
    startPromise = server.start(Studio,broadcastPort)
    startPromise.then(registerRemoteActor.bind(@,rpcPort,broadcastPort))
    startPromise.then((server)->defaultTransport.start(Studio,rpcPort))
    startPromise.then(() -> defaultTransport.onDisconnect(removeActors))
    startPromise.then(sendMessage.bind(@,discoverActorMessage,rpcPort,broadcastPort,null))
    opt.listenTo.onCreateActor((actor)->
      localActors[actor.id] = true
      startPromise.then(sendMessage.bind(@,createActorMessage,rpcPort,broadcastPort,actor))
    )
    opt.listenTo.onDestroyActor((actor)->
      localActors[actor.id] = false
      startPromise.then(sendMessage.bind(@,destroyActorMessage,rpcPort,broadcastPort,actor))
    )
    opt.interceptSend((send)->
      (sender,receiver,message,headers)->
        if localActors[receiver] or not remoteActors[receiver] or remoteActors[receiver].length == 0
          send(sender,receiver,message,headers)
        else
          idx = Math.floor(Math.random() * remoteActors[receiver].length)
          destination = remoteActors[receiver][idx]
          defaultTransport.send(Studio,destination.url,destination.port,{sender:sender,receiver:receiver,body:message,headers:headers})
    )
