import "dotenv/config";
import express from "express";
import { MongoClient } from "mongodb";

const app = express();
const port = process.env.EDGE_NODE_PORT || 3000;
const HVAC_NODE_PORT = process.env.HVAC_NODE_PORT || 3001;
const HVAC_INTERVAL = process.env.HVAC_INTERVAL || 5000;
const TARGET_TEMP = process.env.TARGET_TEMP || 20;
const TARGET_HUMIDITY = process.env.TARGET_HUMIDITY || 50;
const ROOM_IDS = (process.env.ROOM_IDS || '101,102,103').split(',').map(room_id => room_id.trim());

const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/express_app";

const client = new MongoClient(mongoUri);

let readings;
let hvacStatusRecords;
let hvacStatuses = {};

const defaultHvacStatus = {
    heater: 'off',
    aircon: 'off',
    windows: 'closed'
};

app.use(express.json());
app.use((req, _res, next) => {
    console.log(req.method, req.url);
    // console.log(req.body)
    next();
})

// Sensors will POST their data here
app.post('/sensor/readings', async (req, res) => {
    try {
        const data = req.body;
    
        const fields = ['temp', 'humidity', 'co2', 'human_activity_level', 'sensor_id', 'room_id']
        // VALIDATION
        if (!data) {
            console.error('Received no data');
            return res.status(400).json({ 
                status: 'error', 
                message: 'Missing data.' 
            });
        }

        const missingField = fields.find(field => data[field] === undefined);
        if (missingField) {
            console.error(`Received incomplete data (missing field '${missingField}'):`, data);
            return res.status(400).json({
                status: 'error',
                message: `Missing field ${missingField}.`
            });
        }
    
        const reading = {
            timestamp: data.timestamp,
            sensor_id: data.sensor_id,
            room_id: data.room_id,
            temp: data.temp,
            humidity: data.humidity,
            co2: data.co2,
            human_activity_level: data.human_activity_level
        };
        
        const result = await readings.insertOne(reading);
    
        console.log(`    [RECEIVED] Sensor ${data.sensor_id} in Room ${data.room_id} reports data: ${data.temp}°C, ${data.humidity}%, Activity: ${data.human_activity_level}, CO2: ${data.co2}ppm`);
    
        // Successful response: Send a 201 Created or 200 OK status
        res.status(201).json({  
            ...reading,
            _id: result.insertedId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to add sensor readings." });
    }
});

app.delete('/sensor/readings', async (req, res) => {
    try {
        const result = await readings.deleteMany({});
        console.log(`Deleted ${result.deletedCount} readings from the database.`);
        res.status(200).json({ 
            status: 'success', 
            message: `Deleted ${result.deletedCount} readings.` 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete sensor readings." });
    }
});

// Simple endpoint to view the stored data (for testing)
app.get('/sensor/readings', async (req, res) => {
    try {
        const results = await readings.find().sort({ createdAt: -1 }).toArray();
        // console.log(results);

        const data = {
            total_readings: results.length,
            readings: results
        }

        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch items" });
    }
});

async function manageHvacInRoom(room_id) {
    // console.log(`Managing HVAC for room ${room_id}...`);
    // get most recent reading for the room
    const recentReading = await readings.findOne(
        { room_id: room_id },
        { sort: { timestamp: -1 } }
    );
    const currentHvacStatus = hvacStatuses[room_id] || { ...defaultHvacStatus };
    const newHvacStatus = { ...currentHvacStatus };

    // trigger a specific command based on the readings
    // we have temperature, humidity, human_activity_level, and co2
    // can open/close windows, turn on/off heater, turn on/off aircon
    if (recentReading) {
        // console.log(`Recent reading for room ${room_id}:`, recentReading);
        // console.log(`${room_id}: cold enough for heater (temp < 20): ${recentReading.temp < 20}, hot enough for aircon (temp > 25): ${recentReading.temp > 25}, high humidity: ${recentReading.humidity > 60}, high CO2: ${recentReading.co2 > 1000}, high activity: ${recentReading.human_activity_level > 50}`);
        if (recentReading.temp > 25) {
            newHvacStatus.aircon = 'on';
            newHvacStatus.heater = 'off';
        } else if (recentReading.temp < 20) {
            newHvacStatus.heater = 'on';
            newHvacStatus.aircon = 'off';
        }
        if (recentReading.humidity > 60 || recentReading.co2 > 1000) {
            newHvacStatus.windows = 'open';
        } else if (recentReading.humidity < 40) {
            newHvacStatus.windows = 'closed';
        }
        if (recentReading.human_activity_level > 50) {
            newHvacStatus.aircon = 'on';
            newHvacStatus.windows = 'open';
        }
    }

    
    // console.log("Current HVAC status:", currentHvacStatus);
    // console.log("New HVAC status:", newHvacStatus);

    // check if statuses have changed, if so, send commands to HVAC node
    const statusChanges = [];
    if (newHvacStatus.heater !== currentHvacStatus.heater) {
        statusChanges.push(['heater', newHvacStatus.heater]);
        // console.log(`Heater status for room ${room_id} changed from ${currentHvacStatus.heater} to ${newHvacStatus.heater}`);
    }
    if (newHvacStatus.aircon !== currentHvacStatus.aircon) {
        statusChanges.push(['aircon', newHvacStatus.aircon]);
        // console.log(`Aircon status for room ${room_id} changed from ${currentHvacStatus.aircon} to ${newHvacStatus.aircon}`);
    }
    if (newHvacStatus.windows !== currentHvacStatus.windows) {
        statusChanges.push(['windows', newHvacStatus.windows]);
        // console.log(`Windows status for room ${room_id} changed from ${currentHvacStatus.windows} to ${newHvacStatus.windows}`);
    }

    const results = await Promise.all(
        statusChanges.map(async ([device, status]) => ({
            device,
            status,
            succeeded: await setHvacStatus(room_id, device, status)
        }))
    );

    hvacStatuses[room_id] = { ...currentHvacStatus };
    for (const result of results) {
        if (result.succeeded) {
            hvacStatuses[room_id][result.device] = result.status;
            await hvacStatusRecords.updateOne(
                { room_id },
                {
                    $set: {
                        [result.device]: result.status,
                        updatedAt: new Date()
                    },
                    $setOnInsert: {
                        room_id
                    }
                },
                { upsert: true }
            );
        }
    }
}

async function setHvacStatus(room_id, device, status) {
    // set the status of the HVAC for the room
    // device can be 'heater', 'aircon', or 'windows'
    // status can be 'on' or 'off'
    console.log(`Setting ${device} for room ${room_id} to ${status}`);
    try {
        const response = await fetch(`http://localhost:${HVAC_NODE_PORT}/hvac/${room_id}/${device}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: status })
        });
        const result = await response.json();

        if (response.ok) {
            console.log(`    Success (${room_id}): ${device} set to ${status}`);
            return true;
        } else {
            // Handle specific error codes from the server
            console.error(`    Error (${room_id}): ${result.message}`);
            return false;
        }
    } catch (error) {
        // Handle network or server connection failures
        console.error(`    Network Failure (${room_id}): Could not connect to HVAC node.`, error.message);
        return false;
    }
}

async function getHvacStatus(room_id) {
    // get the current status of the HVAC for the room
    // return the status
    try {
        const response = await fetch(`http://localhost:${HVAC_NODE_PORT}/hvac/status/${room_id}`, {
            method: 'GET',
        });
        const result = await response.json();

        if (response.ok) {
            return result.data;
        } else {
            // Handle specific error codes from the server
            console.error(`Error: ${result.message}`);
        }
    } catch (error) {
        // Handle network or server connection failures
        console.error(`Network Failure: Could not connect to HVAC node.`, error.message);
    }
}

async function initialiseHvacStatuses() {
    for (const room_id of ROOM_IDS) {
        const storedStatus = await hvacStatusRecords.findOne({ room_id });
        const remoteStatus = await getHvacStatus(room_id);
        const status = {
            room_id,
            ...defaultHvacStatus,
            ...(storedStatus || {}),
            ...(remoteStatus || {})
        };

        hvacStatuses[room_id] = {
            heater: status.heater,
            aircon: status.aircon,
            windows: status.windows
        };

        await hvacStatusRecords.updateOne(
            { room_id },
            {
                $set: {
                    heater: status.heater,
                    aircon: status.aircon,
                    windows: status.windows,
                    updatedAt: new Date()
                },
                $setOnInsert: {
                    room_id,
                    createdAt: new Date()
                }
            },
            { upsert: true }
        );
        console.log(`Initialised HVAC status for room ${room_id}:`, hvacStatuses[room_id]);
    }
}

// TODO: manage HVAC for each room

async function startServer() {
    try {
        await client.connect();

        const database = client.db();
        readings = database.collection("readings");
        hvacStatusRecords = database.collection("hvac_statuses");
        await hvacStatusRecords.createIndex({ room_id: 1 }, { unique: true });
        console.log("Connected to MongoDB");

        console.log("Initialising HVAC statuses...");
        await initialiseHvacStatuses();

        app.listen(port, () => {
            console.log(`Edge node server running at http://localhost:${port}`);
        });

        setInterval(async () => {
            for (const room_id of ROOM_IDS) {
                try {
                    await manageHvacInRoom(room_id);
                } catch (error) {
                    console.error(`Failed to manage HVAC for room ${room_id}:`, error);
                }
            }
        }, HVAC_INTERVAL);

    } catch (error) {
        console.error("Setup failed or error occurred:", error);
        process.exit(1);
    }
}

async function shutDown() {
    await client.close();
    console.log("MongoDB connection closed");
    process.exit(0);
}

process.on("SIGINT", shutDown);
process.on("SIGTERM", shutDown);

startServer();
