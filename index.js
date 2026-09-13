let config = require('./config');

var osutils = require('os-utils'); // for server load
var mqtt = require('mqtt');
var mqttclient  = mqtt.connect(config.mqtt_server);
var plex_tv_id = 'fdvy04k1o2habxafmk3dewgn';
var plex_office_tv_id = 'ezs3ilhhiyx0gkc8pko6wayv';

// keep track of states of things
let last_state = false;
let last_reading_occupied = false;
let automate_bedroom_lights = false;
let automate_living_room_fan_light = false;

// timer IDs so we can clear previous setTimouts
let hallway_lights_timer_id;

mqttclient.on('connect', function () {
  mqttclient.subscribe('octoPrint/event/PrintDone');
  mqttclient.subscribe('plex/' + plex_tv_id);
  mqttclient.subscribe('plex/' + plex_office_tv_id);
  mqttclient.subscribe('devices/master_bedroom/bed/load');
  mqttclient.subscribe('devices/master_bedroom/bed/automation');
  mqttclient.subscribe('devices/family_room/fanlight_automation');
  mqttclient.subscribe('devices/upstairs_hallway/motion_sensor/motion');
  mqttclient.subscribe('devices/garage_door_opener1/clientstatus');
})

setInterval(function(){ mqttclient.publish('devices/server/load',osutils.loadavg(1).toString()); }, 10000);

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
    let lightsToFade = config.family_room_lights;
    if (!automate_living_room_fan_light) 
      lightsToFade = lightsToFade.filter(v => v.topic != 'devices/family_room/fanlight');
    if (message == 'media.play' || message == 'media.resume') 
      fadeLights(lightsToFade, 'off');
    if (message == 'media.pause' || message == 'media.stop') 
      fadeLights(lightsToFade, 'on');
  }
  if (topic == 'plex/' + plex_office_tv_id) {
    if (message == 'media.play' || message == 'media.resume') 
      fadeLights(config.office_lights, 'off');
    if (message == 'media.pause' || message == 'media.stop') 
      fadeLights(config.office_lights, 'on');
  }

  if (topic == 'devices/family_room/fanlight_automation')
    automate_living_room_fan_light = message == "1";

  /*****************************************
     Turn off lights when I get in bed
  *****************************************/
  if (topic == 'devices/master_bedroom/bed/load' && automate_bedroom_lights) {
    // normal readings appear to be 15 when unoccupied and 35 when occupied.
    let weight = parseInt(message);
    // filter out any crazy numbers
    if (weight > 65 || weight < 10) return;
    let occupied = weight > 25;
    // require two readings in a row to change state
    let changed = (occupied != last_state) && (occupied == last_reading_occupied);
    if (changed) {
      mqttclient.publish('devices/master_bedroom/light' + '/dimming_duration/set', "5");
      mqttclient.publish('devices/master_bedroom/light' + '/level/set', occupied ? '0' : '18');
      //let alert_text = 'Turning ' + (occupied ? 'off' : 'on') + ' light because bed reads ' + weight;
      //console.log(alert_text);
      //mqttclient.publish('notify/me', '{"message":"' + alert_text + '"}');
      last_state = occupied;
    }
    last_reading_occupied = occupied;
  }

  if (topic == 'devices/master_bedroom/bed/automation') {
    if (message == "0")
      automate_bedroom_lights = false;
    else if (message == "1")
      automate_bedroom_lights = true;
    else
      console.log("invalid value: " + message);
  }

  /*****************************************
     Turn on the hallway lights when motion
  *****************************************/
  if (topic == 'devices/upstairs_hallway/motion_sensor/motion') {
    // the message comes in with quotes around it
    if (message == '"Motion Detected at Unknown Location"') {
      //mqttclient.publish('notify/me', '{"message":"motion at stairs"}');
      fadeLights(config.upstairs_hallway_lights, 'on');
      // clear any previous timer to turn off the lights, and
      // schedule the lights to turn off in a minute,
      clearTimeout(hallway_lights_timer_id); // ok if hallway_lights_timer_id is null
      hallway_lights_timer_id = setTimeout(() => { 
        fadeLights(config.upstairs_hallway_lights, 'off');
      }, 60000);
    }
  }

  /*****************************************
     Alert me if the garage door opener disconnects
  *****************************************/
  if (topic == 'devices/garage_door_opener1/clientstatus') {
    mqttclient.publish('notify/me', '{"message":"garage_door_1: ' + message + '"}');
  }
});

function fadeLights(devices, level) {
  let duration = "5";
  // set a duration for each light
  for (let i = 0; i < devices.length; i++)
    mqttclient.publish(devices[i].topic + '/dimming_duration/set', duration);
  // set the level for each light
  for (let i = 0; i < devices.length; i++)
    mqttclient.publish(devices[i].topic + '/level/set', devices[i][level].toString());
}
