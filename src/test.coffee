Studio = require 'studio'
cluster = require './index'
rpcPort = Math.floor(Math.random() *3000) + 9000
console.log("rpcPort = #{rpcPort}")
Studio.use(cluster(rpcPort))

new Studio.Actor({
  id: 'meuId',
  process: ()->
    self = @
    console.log('ping')
    setInterval(()->
      console.log('try')
      self.send('meuId2', 'meuId').then((res)->console.log(res)).catch((err)->console.log('ERRO'))
    ,1000)
}).process()
