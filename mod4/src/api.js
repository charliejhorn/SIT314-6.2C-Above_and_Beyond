import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import weather from 'weather-js';
import { fileURLToPath } from 'url';
import path from 'path';

const app = express();
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/local_weather';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDirectory = path.join(__dirname, '..', 'public');

const sensorSchema = new mongoose.Schema({
    name: { type: String, required: true, default: 'temperature-sensor' },
    address: { type: String, required: true },
    time: { type: Date, required: true, default: Date.now },
    temperature: { type: Number, required: true },
    humidity: { type: Number, min: 0, max: 100 }
});

const Sensor = mongoose.model('Sensor', sensorSchema);
let latestTemperature = null;

app.use(express.json());
app.use(express.static(publicDirectory));

function sendError(res, error) {
    console.error(error);
    res.status(500).json({ error: 'Database request failed' });
}

async function refreshLatestTemperature() {
    const latest = await Sensor.findOne().sort({ time: -1 });
    latestTemperature = latest ? latest.temperature : null;
    return latest;
}

app.get('/api/readings', async (req, res) => {
    try {
        res.json(await Sensor.find().sort({ time: -1 }));
    } catch (error) {
        sendError(res, error);
    }
});

app.get('/api/readings/:id', async (req, res) => {
    try {
        const reading = await Sensor.findById(req.params.id);
        if (!reading) return res.status(404).json({ error: 'Reading not found' });
        res.json(reading);
    } catch (error) {
        res.status(400).json({ error: 'Invalid reading id' });
    }
});

app.post('/api/readings', async (req, res) => {
    try {
        const reading = await Sensor.create(req.body);
        latestTemperature = reading.temperature;
        res.status(201).json(reading);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/api/readings/:id', async (req, res) => {
    try {
        const reading = await Sensor.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!reading) return res.status(404).json({ error: 'Reading not found' });
        await refreshLatestTemperature();
        res.json(reading);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/readings/:id', async (req, res) => {
    try {
        const reading = await Sensor.findByIdAndDelete(req.params.id);
        if (!reading) return res.status(404).json({ error: 'Reading not found' });
        await refreshLatestTemperature();
        res.json({ message: 'Reading deleted', id: req.params.id });
    } catch (error) {
        res.status(400).json({ error: 'Invalid reading id' });
    }
});

app.get('/api/latest-temperature', async (req, res) => {
    try {
        const latest = await refreshLatestTemperature();
        if (!latest) return res.status(404).json({ error: 'No sensor readings yet' });
        res.json({ temperature: latestTemperature, reading: latest });
    } catch (error) {
        sendError(res, error);
    }
});

app.get('/api/weather', (req, res) => {
    const location = req.query.location || 'Melbourne, AU';
    weather.find({ search: location, degreeType: 'C' }, (error, result) => {
        if (error || !result?.length) {
            return res.status(404).json({ error: `No weather found for ${location}` });
        }
        const current = result[0].current;
        res.json({
            source: 'weather-js',
            location: result[0].location,
            temperature: current.temperature,
            feelsLike: current.feelslike,
            description: current.skytext,
            humidity: current.humidity,
            observationTime: current.observationtime
        });
    });
});

app.get('/{*splat}', (req, res) => res.sendFile(path.join(publicDirectory, 'index.html')));

mongoose.connect(mongoUri)
    .then(() => refreshLatestTemperature())
    .then(() => app.listen(port, () => console.log(`listening on port ${port}`)))
    .catch((error) => {
        console.error('Could not connect to MongoDB:', error.message);
        process.exitCode = 1;
    });