Studio = require 'studio'
cluster = require './index'
rpcPort = Math.floor(Math.random() *3000) + 9000
console.log("rpcPort = #{rpcPort}")
Studio.use(cluster(rpcPort))
require './test3Act'