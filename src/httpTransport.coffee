started = false
http = require 'http'

extractBody =(Studio,req) ->
  body=''
  req.on('data',(data)->
    body+=data
  )
  new Studio.Promise((resolve)->req.on('end',()->resolve(JSON.parse(body))))
module.exports = {
  start:(Studio, rpcPort) ->
    if not started
      driver = new Studio.Driver({
        initialize : () ->
          http.createServer((req,res)->
            driver.send(req).then((result)->
              res.writeHead(200, {'Content-Type': 'application/json'})
              res.end(JSON.stringify(result))
            ).catch((error)->
              res.writeHead(500, {'Content-Type': 'application/json'})
              res.end(JSON.stringify(error))
            )
          ).listen(rpcPort)
        parser : (req) ->
          extractBody(Studio,req)
      })
  send:(Studio,url,port,message)->
    options = {
      host: url
      port: port
      method: 'POST'
    }
    new Studio.Promise((resolve)->
      req = http.request(options, (res)->
        extractBody(Studio,res).then((body)->
          resolve(body)
        )
      )
      req.write(JSON.stringify(message))
      req.end()
    )

}
