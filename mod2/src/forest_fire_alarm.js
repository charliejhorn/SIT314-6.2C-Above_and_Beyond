import { subscribeToTopic } from './mqtt.js';

const TOPIC = process.env.MQTT_ALARM_TOPIC || 'alarm';

subscribeToTopic(TOPIC, (message) => {
    console.log("Received message: " + message);
    const data = JSON.parse(message);

    if (data.alert === 'fire') {
        console.log("Fire Alert: severity level " + data.severity);
    }
    if (data.alert === 'smoke') {
        console.log("Smoke Alert: severity level " + data.severity);
    }
    if (data.alert === 'heat') {
        console.log("Heat Alert: severity level " + data.severity);
    }
});