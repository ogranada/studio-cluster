var Studio = require('studio');
var studioCluster = require('../../src'); //require('studio-cluster'); on your projects

//Initialize as above if you want several process in the same machine
//var port = Math.floor(Math.random()*5000) + 5000;// just choosing a random port
//Studio.use(studioCluster({rpcPort:port,prioritizeLocal:false}));

//By default studioCluster prioritize local services when available, in this case, we want to call the same service in different process
Studio.use(studioCluster({prioritizeLocal:false}));

var _mergeSort = Studio('mergeSort');
var _merge = Studio('merge');

Studio(function merge(left, right){
    var result  = [],
        il      = 0,
        ir      = 0;
    console.log('merge  left:' +left + ' right:'+right);
    while (il < left.length && ir < right.length){
        if (left[il] < right[ir]){
            result.push(left[il++]);
        } else {
            result.push(right[ir++]);
        }
    }
    return result.concat(left.slice(il)).concat(right.slice(ir));
});

Studio(function * mergeSort(items){
	console.log('sorting:' +items);
    if (items.length < 2) {
        return items;
    }
    var middle = Math.floor(items.length / 2),
        left    = items.slice(0, middle),
        right   = items.slice(middle);
    left = yield _mergeSort(left);
    right = yield _mergeSort(right);
    return _merge(left, right);
});



setTimeout(function(){
	_mergeSort([3,8,5,4,6,4,3,1,0,49,75,21,47,63,47]).then(function (res){
		console.log('end');
		console.log(res);
	});	
},1000);

