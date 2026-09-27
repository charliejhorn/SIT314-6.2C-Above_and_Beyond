const Locations = require("./locations.cjs");

const apps = []

for (const location of Locations) {
    apps.push({
        name: `temperature-${location}`,
        script: './sensors/temperature_node.js',
        namespace: 'weather_nodes',
        env: {
            LOCATION: location
        }
    });
    apps.push({
        name: `rain-${location}`,
        script: './sensors/rain_node.js',
        namespace: 'weather_nodes',
        env: {
            LOCATION: location
        }
    });
    apps.push({
        name: `wind-${location}`,
        script: './sensors/wind_node.js',
        namespace: 'weather_nodes',
        env: {
            LOCATION: location
        }
    });
    apps.push({
        name: `request-${location}`,
        script: './warning_request.js',
        namespace: 'weather_nodes',
        env: {
            LOCATION: location
        }
    });
}

apps.push({
    name: `cfa`,
    script: './sensors/cfa_node.js',
    namespace: 'weather_nodes',
});

apps.push({
    name: `weather-service`,
    script: './weather_service.js',
    namespace: 'weather_nodes',
})

module.exports = { apps }