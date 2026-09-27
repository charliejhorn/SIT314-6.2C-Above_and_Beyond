import { publishMessage } from './mqtt.js';

const TOPIC_BASE = process.env.MQTT_SENSOR_TOPIC || '/sensor';
const HEAT_RANGE = (process.env.HEAT_RANGE || '0-100').split('-').map(Number);
const SMOKE_RANGE = (process.env.SMOKE_RANGE || '0-100').split('-').map(Number);
const SENSOR_ID = process.env.SENSOR_ID || 'sensor-1';
const INTERVAL = Number(process.env.SENSOR_INTERVAL) || 1000;

const readings = {
    heat: 0,
    smoke: 0,
    fire: false
}

var count = Math.random() * 100; // random starting point for the bell curve simulation

// simulate sensor readings for the variables
// readings move up and down along a bell curve shape within the specified ranges
// random variation above and below the curve is added to the readings to simulate real-world sensor behavior
// if heat and smoke are both above 50, then there's a chance that fire is detected. chance increases as both increase
function simulateSensorReadings() {    
    const heatRange = HEAT_RANGE[1] - HEAT_RANGE[0];
    const smokeRange = SMOKE_RANGE[1] - SMOKE_RANGE[0];
    
    // count identifies where we are in the bell curve cycle
    readings.heat = Math.round(HEAT_RANGE[0] + (heatRange / 2) * (1 + Math.sin(count / 10)) + (Math.random() * 10 - 5), 2);
    readings.smoke = Math.round(SMOKE_RANGE[0] + (smokeRange / 2) * (1 + Math.cos(count / 10)) + (Math.random() * 10 - 5), 2);

    count++;

    // if heat and smoke are both above 50, then there's a chance that fire is detected
    // chance increases as both increase
    if (readings.heat > 50 && readings.smoke > 50) {
        const chance = (readings.heat + readings.smoke) / 200;
        readings.fire = Math.random() < chance;
    } else {
        readings.fire = false;
    }
}

// publish the sensor readings to the MQTT broker as per interval
setInterval(() => {
    simulateSensorReadings();
    for (const [key, value] of Object.entries(readings)) {
        publishMessage(`${TOPIC_BASE}/${SENSOR_ID}/${key}`, value.toString());
    }
    console.log(`Published readings for ${SENSOR_ID}:`, readings);
}, INTERVAL);