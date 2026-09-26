// var count = 0;

// function simulateValue(rangeLimits, randomVariation, cycleLength) {
//     const range = rangeLimits[1] - rangeLimits[0];
//     const bellValue = (1 + Math.sin(count / cycleLength)) / 2;
//     const variation = Math.random() * randomVariation - (randomVariation / 2); 
//     const value = (rangeLimits[0] + range) * bellValue + variation;
//     const clampedValue = Math.max(0, Math.min(100, value));
//     const roundedValue = Math.round(clampedValue, 2);
//     console.log(count, roundedValue);
//     count++;
// }

// setInterval(simulateValue, 100, [0, 100], 10, 10);


const data = {
    temp: 0,
    humidity: 2
};
    
const fields = ['temp', 'humidity', 'human_acitivity_level', 'sensor_id', 'room_id']
// const missingFields = fields.reduce((missing, field), data[field] == undefined ? missing.push(field) : "", [])
let missingFields = fields.reduce((acc, field), acc + field, "")
console.log(missingFields.length, missingFields)
