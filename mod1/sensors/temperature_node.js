import 'dotenv/config';
import { startSensorNode } from './base_sensor_node.js';

const LOCATION = process.env.LOCATION;

function getRandomTemperature() {
    return Math.floor(Math.random() * 40) + 1; // Random temperature between 1 and 40
}

startSensorNode(() => `temp,${LOCATION},${getRandomTemperature()}`);