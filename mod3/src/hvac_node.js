// HVAC: heating, ventilation, air-conditioning
// node gets called to set the current configuration of the room

import "dotenv/config";
import express from "express";

const app = express();
const port = process.env.HVAC_NODE_PORT || 3001;
const ROOM_IDS = (process.env.ROOM_IDS || '101,102,103').split(',');

const roomStatus = {
    heater: 'off',
    aircon: 'off',
    windows: 'closed'
};

const allStatuses = {};

app.use(express.json());
app.use((req, _res, next) => {
    console.log(req.method, req.url);
    // console.log(req.body)
    next();
})

// ENDPOINTS
app.get('/hvac/status/:room_id', async (req, res) => {
    const room_id = req.params.room_id;

    if(!room_id || allStatuses[room_id] == undefined) {
        console.error(`Received request for unknown room_id: ${room_id}`);
        return res.status(400).json({ 
            status: 'error', 
            message: `Unknown room_id: ${room_id}` 
        });
    }

    console.log(`    Received request for HVAC status of room ${room_id}`);
    return res.status(200).json({
        status: 'success',
        data: {
            room_id: room_id,
            heater: allStatuses[room_id]?.heater,
            aircon: allStatuses[room_id]?.aircon,
            windows: allStatuses[room_id]?.windows
        }
    });
});

// endpoint for each of heater, aircon, windows
app.put('/hvac/:room_id/heater', async (req, res) => {
    // body will have { status: 'on' | 'off' }
    const data = req.body;
    
    if (!data || !data.status) {
        console.error('Received no data or missing status field');
        return res.status(400).json({ 
            status: 'error', 
            message: 'Missing data or status field.' 
        });
    }

    if (data.status !== 'on' && data.status !== 'off') {
        console.error('Invalid status value:', data.status);
        return res.status(400).json({ 
            status: 'error', 
            message: 'Invalid status value. Must be "on" or "off".' 
        });
    }

    allStatuses[req.params.room_id] = allStatuses[req.params.room_id] || {};
    allStatuses[req.params.room_id].heater = data.status;
    console.log(`Heater status for room ${req.params.room_id} set to ${data.status}`);
    return res.status(200).json({ 
        status: 'success', 
        message: `Heater status set to ${data.status}.` 
    });
});

app.put('/hvac/:room_id/aircon', async (req, res) => {
    // body will have { status: 'on' | 'off' }
    const data = req.body;
    
    if (!data || !data.status) {
        console.error('Received no data or missing status field');
        return res.status(400).json({ 
            status: 'error', 
            message: 'Missing data or status field.' 
        });
    }

    if (data.status !== 'on' && data.status !== 'off') {
        console.error('Invalid status value:', data.status);
        return res.status(400).json({ 
            status: 'error', 
            message: 'Invalid status value. Must be "on" or "off".' 
        });
    }

    allStatuses[req.params.room_id] = allStatuses[req.params.room_id] || {};
    allStatuses[req.params.room_id].aircon = data.status;
    console.log(`Aircon status for room ${req.params.room_id} set to ${data.status}`);
    return res.status(200).json({ 
        status: 'success', 
        message: `Aircon status set to ${data.status}.` 
    });
});

app.put('/hvac/:room_id/windows', async (req, res) => {
    // body will have { status: 'open' | 'closed' }
    const data = req.body;
    
    if (!data || !data.status) {
        console.error('Received no data or missing status field');
        return res.status(400).json({ 
            status: 'error', 
            message: 'Missing data or status field.' 
        });
    }

    if (data.status !== 'open' && data.status !== 'closed') {
        console.error('Invalid status value:', data.status);
        return res.status(400).json({ 
            status: 'error', 
            message: 'Invalid status value. Must be "open" or "closed".' 
        });
    }

    allStatuses[req.params.room_id] = allStatuses[req.params.room_id] || {};
    allStatuses[req.params.room_id].windows = data.status;
    console.log(`Windows status for room ${req.params.room_id} set to ${data.status}`);
    return res.status(200).json({ 
        status: 'success', 
        message: `Windows status set to ${data.status}.` 
    });
});

async function startServer() {
    try {   
        for (const room_id of ROOM_IDS) {
            allStatuses[room_id] = { ...roomStatus };
            console.log(`Initialised HVAC status for room ${room_id}:`, allStatuses[room_id]);
        }

        app.listen(port, () => {
            console.log(`HVAC Server running at http://localhost:${port}`);
        });
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

startServer();
