import 'dotenv/config';
import net from "net";
import Locations from "./locations.cjs";

const port = process.env.SERVER_PORT;

// const weather = {};
// for (const location of Locations) {
//     weather[location] = {
//         temp: null,
//         wind: null,
//         rain: null,
//         cfa_rating: null,
//     };
// }

function createWeatherObject() {
    const weather = {};
    for (const location of Locations) {
        weather[location] = {
            temp: null,
            wind: null,
            rain: null,
            cfa_rating: null,
        };
    }
    return weather;
}

function parseCfaData(weather, data) {
    const ratings = data.split("|");
    for (const rating of ratings) {
        if (!rating.includes(":") || rating.length < 3) {
            continue;
        }
        const [location, ratingValue] = rating.split(":");
        // console.log(`Parsed CFA data - Location: ${location}, Rating: ${ratingValue}`);
        if (!weather[location]) {
            console.log(`Warning: Received CFA data for unknown location: ${location}`);
            continue;
        }
        weather[location].cfa_rating = ratingValue;
    }
}


const server = net.createServer((socket) => {
    const weather = createWeatherObject();

    console.log("Client connected");

    socket.on("data", (data) => {
        const strData = data.toString();
        console.log(`Received: ${strData}`);

        const message = strData.split(",");
        const command = message[0];
        let value;
        let location;
        if (command === "request") {
            location = message[1];
        } 
        else if (command === "cfa") {
            value = message[1];
        }
        else {
            location = message[1];
            value = parseFloat(message[2]);
        }
        let result;

        switch (command) {
            case "request":
                // console.log(value);
		        if(weather[location].temp > 20 
                 || weather[location].rain < 50 
                 || weather[location].wind > 30
                 || weather[location].cfa_rating === "EXTREME"
                 || weather[location].cfa_rating === "CATASTROPHIC"
                ){
		            result = "Weather Warning";    
                }
                else {
                    result = "Everything fine";    
                }
                break;

            case "cfa":
                // received value will be in format of:
                // location:ration|location:rating|location:rating
                parseCfaData(weather, value);
		        result = "ok";
                break;

            case "temp":
		        weather[location].temp = value;
		        result = "ok";
                break;

            case "rain":
		        weather[location].rain = value;
                result = "ok";
                break;

            case "wind":
		        weather[location].wind = value;
		        result = "ok";
                break;            
        }
        socket.write(result.toString());
    });

    socket.on("end", () => {
        console.log("Client disconnected");
    });

    socket.on("error", (error) => {
        console.log(`Socket Error: ${error.message}`);
    });
});

server.on("error", (error) => {
    console.log(`Server Error: ${error.message}`);
});

server.listen(port, () => {
    console.log(`TCP socket server is running on port: ${port}`);
});
