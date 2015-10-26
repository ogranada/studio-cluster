var Studio, cluster, rpcPort;
Studio = require('studio');
cluster = require('../compiled/index');
rpcPort = Math.floor(Math.random() * 3000) + 9000;

Studio.use(cluster(rpcPort));

new Studio.Actor({
    id: 'remoteActor',
    process: function(message) {
        return message;
    }
});
