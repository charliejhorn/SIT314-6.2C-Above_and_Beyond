import 'dotenv/config';
import { startSensorNode } from './base_sensor_node.js';

const LOCATION = process.env.LOCATION;

function getRandomRainfall() {
    return Math.floor(Math.random() * 200) + 1; // Random rainfall between 1 and 200
}

startSensorNode(() => `rain,${LOCATION},${getRandomRainfall()}`);