import 'dotenv/config';
import { startSensorNode } from './base_sensor_node.js';

const LOCATION = process.env.LOCATION;

function getRandomWindSpeed() {
    return Math.floor(Math.random() * 100) + 1; // Random wind speed between 1 and 100
}

startSensorNode(() => `wind,${LOCATION},${getRandomWindSpeed()}`);