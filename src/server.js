var dgram = require('dgram');
var client = dgram.createSocket({type:'udp4',reuseAddr:true});
var started = null;

module.exports = {
    start: function (Studio, broadcastPort) {
        if (!started) {
            started = new Studio.promise(function (resolve, reject) {
                client.bind({port: broadcastPort, exclusive: false}, function () {
                    client.setBroadcast(true);
                    resolve(client);
                });
                client.on('error', function (error) {
                    console.log(error);
                    client.close();
                    reject(error);
                });
            });
        }
        return started;
    }
};