import 'dotenv/config';

const EDGE_NODE_URL = process.env.EDGE_NODE_URL || "localhost:3000";
const INTERVAL_MS = process.env.SENSOR_INTERVAL_MS || 3000; // Send data every 3 seconds

const publishData = async (data) => {
    try {
        const response = await fetch(EDGE_NODE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // The body must be a JSON string
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            console.log(`✅ Success (${data.sensor_id}): Data posted successfully!`);
        } else {
            // Handle specific error codes from the server
            console.error(`❌ Error (${data.sensor_id}): ${result.message}`);
        }
    } catch (error) {
        // Handle network or server connection failures
        console.error(`🚨 Network Failure (${data.sensor_id}): Could not connect to edge node.`, error.message);
    }
};

const simulateSensors = (dataSimulationFunction) => {
    console.log('Starting sensor simulation cycle...');
    
    // // Create an array of promises to send data concurrently
    // const promises = SENSOR_IDS.map(sensorId => {
    //     const data = dataSimulationFunction();
    //     return publishData(data);
    // });
    
    // // Wait for all publishers to attempt their post
    // Promise.all(promises).catch(err => {
    //     console.error("A critical error occurred during simulation:", err);
    // });

    const data = dataSimulationFunction();
    return publishData(data);
};

export const runSensorSimulation = (dataSimulationFunction) => {    
    console.log("🚀 Initializing Sensor Simulator...");
    
    // run the simulation repeatedly
    setInterval(simulateSensors, INTERVAL_MS, dataSimulationFunction);
}
