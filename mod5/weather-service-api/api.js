import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import weather from 'weather-js';

const app = express();
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGODB_URI;

const readingSchema = new mongoose.Schema({
    name: { type: String, required: true, default: 'weather-sensor' },
    time: { type: Date, required: true, default: Date.now },
    temperature: { type: Number, required: true },
    humidity: { type: Number, min: 0, max: 100 }
});

const Readings = mongoose.model('readings', readingSchema);
let latestReading = {};

app.use(express.json());

function sendError(res, error) {
    console.error(error);
    res.status(500).json({ error: 'Database request failed' });
}

async function refreshLatestReading() {
    const latest = await Readings.findOne().sort({ time: -1 });
    latestReading = latest || {};
    return latest;
}

app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});

app.get('/api/readings', async (req, res) => {
    try {
        res.json(await Readings.find().sort({ time: -1 }));
    } catch (error) {
        sendError(res, error);
    }
});

app.get('/api/readings/:id', async (req, res) => {
    try {
        const reading = await Readings.findById(req.params.id);
        if (!reading) return res.status(404).json({ error: 'Reading not found' });
        res.json(reading);
    } catch (error) {
        res.status(400).json({ error: 'Invalid reading id' });
    }
});

app.post('/api/readings', async (req, res) => {
    try {
        const reading = await Readings.create(req.body);
        latestReading = reading;
        res.status(201).json(reading);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/api/readings/:id', async (req, res) => {
    try {
        const reading = await Readings.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!reading) return res.status(404).json({ error: 'Reading not found' });
        await refreshLatestReading();
        res.json(reading);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/readings/:id', async (req, res) => {
    try {
        const reading = await Readings.findByIdAndDelete(req.params.id);
        if (!reading) return res.status(404).json({ error: 'Reading not found' });
        await refreshLatestReading();
        res.json({ message: 'Reading deleted', id: req.params.id });
    } catch (error) {
        res.status(400).json({ error: 'Invalid reading id' });
    }
});

app.get('/api/latest-reading', async (req, res) => {
    try {
        const latest = await refreshLatestReading();
        if (!latest) return res.status(404).json({ error: 'No sensor readings yet' });
        res.json(latest);
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

mongoose.connect(mongoUri)
    .then(() => console.log('Connected to MongoDB'))
    .then(() => refreshLatestReading())
    .then(() => app.listen(port, "0.0.0.0", () => console.log(`listening on port ${port}`)))
    .catch((error) => {
        console.error('Could not connect to MongoDB:', error.message);
        process.exitCode = 1;
    });