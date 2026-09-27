import 'dotenv/config';
import mqtt from 'mqtt';

const HOST = process.env.MQTT_HOST || 'localhost';
const PORT = process.env.MQTT_PORT || 1883;

const client = mqtt.connect(`mqtt://${HOST}:${PORT}`, {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD
});

client.on('connect', () => {
    console.log(`Connected to MQTT broker at ${HOST}:${PORT}`);
});

client.on('error', (err) => {
    console.error('MQTT connection error:', err);
});

// export a 'publish message' function that can be used by other modules
export function publishMessage(topic, message) {
    client.publish(topic, message, (err) => {
        if (err) {
            console.error('Error publishing message:', err);
        } else {
            console.log(`Message published to topic ${topic}: ${message}`);
        }
    });
}

export function subscribeToTopic(topic, messageHandler) {
    client.subscribe(topic, (err) => {
        if (err) {
            console.error(`Error subscribing to topic ${topic}:`, err);
        } else {
            console.log(`Subscribed to topic ${topic}`);
        }
    });

    client.on('message', (receivedTopic, message) => {
        if (receivedTopic === topic) {
            messageHandler(message.toString());
        }
    });
}
