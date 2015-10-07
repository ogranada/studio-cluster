Studio = require 'studio'
new Studio.Actor({
  id: 'meuId3',
  watchPath:__filename,
  process: (message)->
    console.log(message)
    'hello ---> ' + message
})
