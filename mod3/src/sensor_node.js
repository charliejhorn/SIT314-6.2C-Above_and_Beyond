import 'dotenv/config';

const EDGE_NODE_URL = process.env.EDGE_NODE_URL || "http://localhost:3000";
const INTERVAL_MS = process.env.SENSOR_INTERVAL_MS || 3000; // default 3 seconds
const TEMP_RANGE = (process.env.TEMP_RANGE || '0-40').split('-').map(Number);
const HUMIDITY_RANGE = (process.env.HUMIDITY_RANGE || '20-100').split('-').map(Number);
const CO2_RANGE = (process.env.CO2_RANGE || '400-1800').split('-').map(Number);
const ACTIVITY_RANGE = (process.env.ACTIVITY_RANGE || '0-100').split('-').map(Number);
const SENSOR_ID = process.env.SENSOR_ID || 999;
const ROOM_ID = process.env.ROOM_ID || "A1";

var count = Math.floor(Math.random() * 100); // random starting point for the bell curve simulation

function simulateValue(rangeLimits, randomVariation, cycleLength) {
    const range = rangeLimits[1] - rangeLimits[0];
    const bellValue = (1 + Math.sin(count / cycleLength)) / 2;
    const variation = Math.random() * randomVariation - (randomVariation / 2); 
    const value = (rangeLimits[0] + range) * bellValue + variation;
    const clampedValue = Math.max(0, Math.min(100, value));
    const roundedValue = Math.round(clampedValue, 2);
    return roundedValue;
}

function getReadings() {
    count++;
    return {
        temp: simulateValue(TEMP_RANGE, 3, 10),
        humidity: simulateValue(HUMIDITY_RANGE, 3, 30),
        co2: simulateValue(CO2_RANGE, 10, 30),
        human_activity_level: simulateValue(ACTIVITY_RANGE, 3, 20)
    }
}

const publishData = async (data) => {
    try {
        const response = await fetch(`${EDGE_NODE_URL}/sensor/readings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // The body must be a JSON string
            body: JSON.stringify(data)
        });
        const result = await response.json();

        if (response.ok) {
            console.log(`    Success (${data.sensor_id}): Data posted successfully!`);
        } else {
            // Handle specific error codes from the server
            console.error(`    Error (${data.sensor_id}): ${result.message}`);
        }
    } catch (error) {
        // Handle network or server connection failures
        console.error(`    Network Failure (${data.sensor_id}): Could not connect to edge node.`, error.message);
    }
};

function simulateSensors() {
    console.log('Sending sensor readings...');

    // console.log(simulateValue([0,10], 1, 10));
    
    // const readings = getReadings();
    const data = {
        ...getReadings(),
        timestamp: new Date().toISOString(),
        sensor_id: SENSOR_ID,
        room_id: ROOM_ID,
    }
    return publishData(data);
};



console.log("Initializing Sensor Simulator...");
console.log(`Edge node URL: ${EDGE_NODE_URL}`)
    
// run the simulation repeatedly
setInterval(simulateSensors, INTERVAL_MS);