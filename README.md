Zero configuration cluster module for studio.

Currently under development and tests.

Dont use this project in production yet, this is inteded to serve as a experiment for the implementation.

The goal is to enable remote procedure call and service discovery for Studio services, with absolutely no configuration.

To do this all services needs to be running in the same network. They all communicate through a broadcast port (default to 10121). And they also need a port 
to direct communication (default do 10120). If you want to test the process automatic communication on the same machine all you need to do is to choose a different port for one of the process.



Process 1:

```js
var Studio = require('studio');
var studioCluster = require('studio-cluster');
Studio.use(studioCluster());

Studio(function test1(){
    return 'test';
});


//Just keep the process running
setInterval(function(){},10000);
```

Process 2:

```js
var Studio = require('studio');

var studioCluster =require('./src');// require('studio-cluster');`
// you only need to choose a rpcPort if your process are running in the same machine, then you need a port to each process
Studio.use(studioCluster({rpcPort:10199}));

var test1 = Studio('test1');
Studio(function test2(){
    //call remote service
    return test1().then(function(message){
        console.log(message);
    }).catch(function(err){
        console.error(err);
    });
});


var test2 =  Studio('test2');

setInterval(test2,1500);
```