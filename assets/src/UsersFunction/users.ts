import { Handler } from "aws-lambda";








export async function handler(event: Handler) {
    console.log(`Event recieved: ${JSON.stringify(event, null, 2)}`);

    const url = "http://checkip.amazonaws.com/";
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`response status: ${response.status}`);
        };
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Yeeer",
                location: response.text()
            }),
        }
    } catch (error) {
        throw error;
    }
};
