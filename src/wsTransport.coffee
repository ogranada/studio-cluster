WebSocketServer = require('websocket').server
http = require 'http'
driver = null
protocol = 'studio'
WebSocketClient = require('websocket').client

server = http.createServer((request, response)->
  response.writeHead(404)
  response.end()
)
connections = {}
originIsAllowed = (req) -> true

generateId = ()->
  new Date/1
module.exports = {
  start:(Studio, rpcPort) ->
    if not driver
      driver = new Studio.Driver({
        initialize : () ->
          server.listen(rpcPort, ()->)
          wsServer = new WebSocketServer({
            httpServer: server,
            autoAcceptConnections: false
          })
          wsServer.on('request', (request)->
            if originIsAllowed(request)
              connection = request.accept(protocol, request.origin)
              connection.on('message', (message)->
                message = JSON.parse(message.utf8Data)
                driver.send(message.m).then((res)->
                  connection.sendUTF(JSON.stringify({i:message.i, m:res,s:1}))
                ).catch((err)->
                  connection.sendUTF(JSON.stringify({i:message.i, m:err,s:0}))
                )
              )
              connection.on('close', (reasonCode, description)->console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.'))
            else
              request.reject()
          )
        parser : (message) -> message
      })
    driver
  send:(Studio,url,port,message)->
    _self = @
    if not connections[url+':'+port]
      clientPromise = new Studio.Promise((resolve,reject)->
        client = new WebSocketClient()
        client.on('connectFailed', (error) ->_self.disconnectFunction?(url,port))
        client.on('connect', (connection)->
          connection.on('error', (error) ->_self.disconnectFunction?(url,port))
          connection.on('close', ()->_self.disconnectFunction?(url,port))
          client.connection = connection
          client.connection.on('message', (message)->
            jsonMessage = JSON.parse(message.utf8Data)
            if client._promises[jsonMessage.i]
              funk = if jsonMessage.s then client._promises[jsonMessage.i].resolve else client._promises[jsonMessage.i].reject
              funk(jsonMessage.m)
          )
          resolve(client)
        )
        client.connect("ws://#{url}:#{port}/", protocol)
        client._promises={}
      )
      connections[url+':'+port] = clientPromise
    connections[url+':'+port].then((client)->
      id = generateId()
      _resolve = null
      _reject = null
      promise = new Promise((resolve,reject)->
        _resolve = resolve
        _reject = reject
      )
      client._promises[id] = {
        resolve: _resolve
        reject:_reject
      }
      client.connection.sendUTF(JSON.stringify({i:id,m:message}))
      promise
    )
  disconnectFunction:(url,port) ->
    connections[url+':'+port] = null
  onDisconnect:(funk)->
    oldDisconnect = @disconnectFunction
    @disconnectFunction = (url,port) ->
      oldDisconnect(url,port)
      funk(url,port)

}