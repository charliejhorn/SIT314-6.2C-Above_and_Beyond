import 'dotenv/config';
import { startSensorNode } from './sensors/base_sensor_node.js';

const LOCATION = process.env.LOCATION;
const INTERVAL = Number(process.env.REQUEST_INTERVAL || 2000);

startSensorNode(
    () => `request,${LOCATION}`,
    {
        interval: INTERVAL,
        responseIsHealthy: () => true,
    },
);