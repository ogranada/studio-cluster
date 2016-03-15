var Studio, cluster, rpcPort;
Studio = require('studio');
cluster = require('../src');
rpcPort = 10122;
Studio.use(cluster({rpcPort:rpcPort}));

Studio.module('basic')(function receiver(){
   return 'HELLO';
});

Studio.module('basic')(function receiverWithError(){
    throw new Error('ERROR');
});

Studio.module('basic')(function sum(a,b){
    return a+b;
});

Studio.module('cancel')(function delayed(time){
    return Studio.promise.delay(time).then(function(){
        process.exit(1);
        return time;
    });
});
