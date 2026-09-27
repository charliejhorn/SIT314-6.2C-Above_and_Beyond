import 'dotenv/config';

const API_URL = process.env.API_URL;
const SENSOR_NAME = process.env.SENSOR_NAME || "sensor-001";
const SENSOR_INTERVAL = parseInt(process.env.SENSOR_INTERVAL) || 5000; // default to 5 seconds

function getRandomReadings() {
    const temperature = (Math.random() * 10 + 20).toFixed(1); // random temperature between 20 and 30
    const humidity = (Math.random() * 20 + 40).toFixed(1); // random humidity between 40 and 60
    return { temperature, humidity };
}

async function sendReadings() {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: SENSOR_NAME,
                time: Date.now(),
                ...getRandomReadings()
            })
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Data sent successfully:", data);
    } catch (error) {
        console.error("Error sending data:", error);
    }
}

// setInterval(sendReadings, SENSOR_INTERVAL); // send readings every 5 seconds

sendReadings(); // send readings once