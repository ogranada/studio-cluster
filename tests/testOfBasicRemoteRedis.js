var Studio, cluster, rpcPort;
Studio = require('studio');
cluster = require('../src');
rpcPort = 10130;
Studio.use(cluster({
	rpcPort:rpcPort,
	publisher:cluster.publisher.redis(rpcPort, '127.0.0.1',true)
}));

Studio.module('basic_redis')(function receiver(){
	setTimeout(function(){
		process.exit(1);
	},1000);
   return 'HELLO';
});