const NUM_SENSORS = 3;

const apps = []

for (let i = 0; i < NUM_SENSORS; i++) {
    apps.push({
        name: `weather-sensor-${i}`,
        script: 'index.js',
        env: {
            SENSOR_NAME: `sensor_${i}`,
        },
        namespace: `sensor`,
    });
}

module.exports = {
    apps
};