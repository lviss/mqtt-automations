let config = require('./config');

var mqtt = require('mqtt');
var mqttclient  = mqtt.connect(config.mqtt_server);
var plex_tv_id = 'mhi9x8y9k4fmwblbcbyoeobv';

// keep track of states of things
let last_state = false;
let last_reading_occupied = false;

mqttclient.on('connect', function () {
  mqttclient.subscribe('octoPrint/event/PrintDone');
  mqttclient.subscribe('plex/' + plex_tv_id);
  mqttclient.subscribe('devices/master_bedroom/bed/load');
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
      setLivingRoomLights("0");
    if (message == 'media.pause' || message == 'media.stop') 
      setLivingRoomLights("99");
  }

  /*****************************************
     Turn off lights when I get in bed
  *****************************************/
  if (topic == 'devices/master_bedroom/bed/load') {
    // normal readings appear to be 15 when unoccupied and 35 when occupied.
    let weight = parseInt(message);
    // filter out any crazy numbers
    if (weight > 65 || weight < 10) return;
    let occupied = weight > 25;
    // require two readings in a row to change state
    let changed = (occupied != last_state) && (occupied == last_reading_occupied);
    if (changed) {
      mqttclient.publish('devices/master_bedroom/light' + '/dimming_duration/set', "5");
      mqttclient.publish('devices/master_bedroom/light' + '/level/set', occupied ? '0' : '50');
      let alert_text = 'Turning ' + (occupied ? 'off' : 'on') + ' light because bed reads ' + weight;
      console.log(alert_text);
      mqttclient.publish('notify/me', '{"message":"' + alert_text + '"}');
      last_state = occupied;
    }
    last_reading_occupied = occupied;
  }
});

function setLivingRoomLights(level) {
  let duration = "5";
  let devices = [
    'devices/kitchen/lights3',
    'devices/kitchen/lights4',
    'devices/family_room/fanlight'
  ];
  // set a duration for each light
  for (let i = 0; i < devices.length; i++)
    mqttclient.publish(devices[i] + '/dimming_duration/set', duration);
  // set the level for each light
  for (let i = 0; i < devices.length; i++)
    mqttclient.publish(devices[i] + '/level/set', level);
}

