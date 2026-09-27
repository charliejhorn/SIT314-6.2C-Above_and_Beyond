import 'dotenv/config';
import { parseStringPromise } from 'xml2js';
import { startSensorNode } from './base_sensor_node.js';
// import { cheerio } from 'cheerio';
// fix importing cheerio for ESM
// SyntaxError: The requested module 'cheerio' does not provide an export named 'default'
import * as cheerio from 'cheerio';

startSensorNode(async () => `cfa,${await request_cfa_rating()}`);

async function request_cfa_rating() {
    // request CFA RSS feed
    const rss_url = "https://www.cfa.vic.gov.au/cfa/rssfeed/tfbfdrforecast_rss.xml";

    const response = await fetch(rss_url);
    const data = await response.text();
    const result = await parseStringPromise(data);

    for (const item of result.rss.channel[0].item) {
        const description = item.description[0];
        const $ = cheerio.load(description);
        
        // EXAMPLE DESCRIPTION:
        // <p>Today, Sun, 19 Jul 2026 is not currently a day of Total Fire Ban.</p><p>Central: NO - RESTRICTIONS MAY APPLY<br>East Gippsland: NO - RESTRICTIONS MAY APPLY<br>Mallee: NO - RESTRICTIONS MAY APPLY<br>North Central: NO - RESTRICTIONS MAY APPLY<br>North East: NO - RESTRICTIONS MAY APPLY<br>Northern Country: NO - RESTRICTIONS MAY APPLY<br>South West: NO - RESTRICTIONS MAY APPLY<br>West and South Gippsland: NO - RESTRICTIONS MAY APPLY<br>Wimmera: NO - RESTRICTIONS MAY APPLY<br></p><p>Fire Danger Ratings</p><p>Central: NO RATING<br>East Gippsland: NO RATING<br>Mallee: NO RATING<br>North Central: NO RATING<br>North East: NO RATING<br>Northern Country: NO RATING<br>South West: NO RATING<br>West and South Gippsland: NO RATING<br>Wimmera: NO RATING<br></p>

        // extract each location and rating from the description
        // returned value should be in format of:
        // location:ration|location:rating|location:rating
        let ratings = "";
        $('p').each((i, elem) => {
            const text = $(elem).text();
            console.log(text);
            if (!text.includes("Fire Danger Ratings")) {
                console.log("Not a Fire Danger Ratings section");
                return;
            }
            const ratingsHTML = $(elem).next().html();

            ratings = ratingsHTML.replace(/<br>/g, '|').replace(/: /g, ':');
        });

        console.log(`Sent: cfa,${ratings}`);
        return ratings;
    }

    return "";
}