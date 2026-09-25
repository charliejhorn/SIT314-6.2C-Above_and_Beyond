import 'dotenv/config';
import net from "net";

const HOST = process.env.SERVER_HOST;
const PORT = process.env.SERVER_PORT;
const DEFAULT_INTERVAL = Number(process.env.SENSOR_INTERVAL || 2000);

export function startSensorNode(createMessage, options = {}) {
    const interval = options.interval || DEFAULT_INTERVAL;
    const responseIsHealthy = options.responseIsHealthy || (response => response === "ok");
    const responseTimeout = Math.max(interval, 1000);
    let client;
    let reconnectTimer;
    let responseTimer;

    function reconnect() {
        if (reconnectTimer) {
            return;
        }

        if (client && !client.destroyed) {
            client.destroy();
        }

        reconnectTimer = setTimeout(() => {
            reconnectTimer = undefined;
            connect();
        }, responseTimeout);
    }

    function connect() {
        client = net.createConnection(PORT, HOST, () => {
            console.log("Connected");
        });

        client.on("data", (data) => {
            const response = data.toString().trim();
            console.log(`Received: ${response}`);

            if (responseTimer) {
                clearTimeout(responseTimer);
                responseTimer = undefined;
            }

            if (!responseIsHealthy(response)) {
                reconnect();
            }
        });

        client.on("error", (error) => {
            console.log(`Error: ${error.message}`);
            reconnect();
        });

        client.on("close", () => {
            console.log("Connection closed");
            reconnect();
        });
    }

    connect();

    setInterval(() => {
        Promise.resolve(createMessage()).then(message => {
            if (!client || client.destroyed || !client.writable) {
                return;
            }

            client.write(message);
            console.log(`Sent: ${message}`);

            if (!responseTimer) {
                responseTimer = setTimeout(() => {
                    responseTimer = undefined;
                    console.log("No response received");
                    reconnect();
                }, responseTimeout);
            }
        }).catch(error => {
            console.log(`Sensor data error: ${error.message}`);
        });
    }, interval);
}
