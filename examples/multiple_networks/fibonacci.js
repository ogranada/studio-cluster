var Studio = require('studio');
var studioCluster = require('../../src'); //require('studio-cluster'); on your projects

var port = 10120;// just choosing a random port
//By default studioCluster prioritize local services when available, in this case, we want to call the same service in different process
Studio.use(studioCluster({
    rpcPort:port,
    balance: studioCluster.balance.random({ percentLocal: 50 }),
    publisher:studioCluster.publisher.redis(port,'YOUR_REDIS_ADDRESS')
}));

var _fib = Studio('fibonacci');

Studio(function * fibonacci(n) {
    console.log('Calculating fibonacci for ' +n);
    var first,second;
    if (n < 2){
        return 1;
    }else{
        first = yield _fib(n-2);
        second = yield _fib(n-1);
        return first + second;
    }
});


setTimeout(function(){
	_fib(7).then(function (res){
		console.log('end');
        console.log('----------------------');
		console.log(res);
	});	
},1000);
    