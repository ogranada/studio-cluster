var Studio = require('studio');
var studioCluster = require('../../src'); //require('studio-cluster'); on your projects

Studio.use(studioCluster());

Studio(function sayHello(name){
    return 'Hello '+name;  
});


//Just keep the process running
setInterval(function(){},10000);