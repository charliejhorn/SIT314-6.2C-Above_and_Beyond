import { runSensorSimulation } from './base_sensor_node.js';

function simulateTemperature() {
    var count = Math.random() * 100; // random starting point for the bell curve simulation
    const TEMP_RANGE = (process.env.TEMP_RANGE || '0-100').split('-').map(Number);
    const tempRange = TEMP_RANGE[1] - TEMP_RANGE[0];
    const randomVariation = 3
    const cycleLength = 10
    var temp = Math.round(
        TEMP_RANGE[0] + (tempRange / 2) * (1 + Math.sin(count / cycleLength) 
            + (Math.random() * randomVariation - randomVariation / 2), 2));
    count++;
    return temp;
}

runSensorSimulation(simulateTemperature);