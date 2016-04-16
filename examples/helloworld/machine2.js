var Studio = require('studio');

var studioCluster = require('../../src'); //require('studio-cluster'); on your projects
//Studio.use(studioCluster());
// you only need to choose a rpcPort if your process are running in the same machine, then you need a port to each process as in:
 Studio.use(studioCluster({rpcPort:8081}));

var helloService = Studio('sayHello');

//Keep calling every second
setInterval(function(){
    helloService('Erich').then(function(result){
        console.log(result);// Prints: Hello Erich
    });    
},1000);


