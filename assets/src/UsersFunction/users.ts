import { Handler } from "aws-lambda";
import { configDotenv } from "dotenv";



const USERS_TABLE = process.env.USERS_TABLE;



export async function handler(event: Handler) {
    console.log(`Event recieved: ${JSON.stringify(event, null, 2)}`);
    console.log(USERS_TABLE);

    const ip = "http://checkip.amazonaws.com/";
    try {
        const response = await fetch(ip);
        if (!response.ok) {
            throw new Error(`response status: ${response.status}`);
        };
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Yeeer",
                location: `Your ip is ${response.text()}`
            }),
        }
    } catch (error) {
        throw error;
    }
};
