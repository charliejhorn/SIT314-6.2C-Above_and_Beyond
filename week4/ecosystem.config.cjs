const locations = ['buller', 'hotham', 'feathertop', 'bogong', 'razorback']

const apps = []

const namespace = 'forest_fire_monitoring'

for (const location of locations) {
    apps.push({
        name: `forest-sensor-${location}`,
        script: './src/sensor_node.js',
        namespace: namespace,
        env: {
            SENSOR_ID: location
        }
    });
}

apps.push({
    name: `forest-fire-alarm`,
    script: './src/forest_fire_alarm.js',
    namespace: namespace
})

module.exports = { apps }