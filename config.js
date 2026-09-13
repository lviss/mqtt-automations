module.exports = {
  mqtt_server: 'mqtt://10.0.0.2',
  // these next arrays list all the lights that should
  // turn on/off, and what values they should switch
  // between when they turn on and off.
  office_lights: [
    { on: 99, off: 0, topic: 'devices/office/light' }
  ],
  family_room_lights: [
    { on: 99, off: 0, topic: 'devices/kitchen/lights3' },
    { on: 99, off: 0, topic: 'devices/kitchen/lights4' },
    { on: 30, off: 0, topic: 'devices/family_room/can_lights' },
    { on: 99, off: 0, topic: 'devices/family_room/fanlight' },
  ],
  upstairs_hallway_lights: [
    { on: 99, off: 0, topic: 'devices/upstairs_hallway/lights' }
  ]
}
