let config = require('./config');

var mqtt = require('mqtt');
var mqttclient  = mqtt.connect(config.mqtt_server);
var plex_tv_id = 'mhi9x8y9k4fmwblbcbyoeobv';

mqttclient.on('connect', function () {
  mqttclient.subscribe('octoPrint/event/PrintDone');
  mqttclient.subscribe('plex/' + plex_tv_id);
})

mqttclient.on('message', function (topic, messageBuf) {
  let message = messageBuf.toString();

  /*****************************************
     Notify me when 3d printer finishes
  *****************************************/
  if (topic == 'octoPrint/event/PrintDone') {
    var data = JSON.parse(message);
    mqttclient.publish('notify/me', '{"message":"print done: ' + data.name + '"}');
  }

  /*****************************************
     Dim lights when plex starts playing
  *****************************************/
  if (topic == 'plex/' + plex_tv_id) {
    if (message == 'media.play' || message == 'media.resume')
      mqttclient.publish('devices/kitchen/lights/level/set', "0");
    if (message == 'media.pause' || message == 'media.stop')
      mqttclient.publish('devices/kitchen/lights/level/set', "99");
  }
});
