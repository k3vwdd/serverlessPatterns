import { APIGatewayProxyEvent } from "aws-lambda";
import { DeleteCommand, DynamoDBDocument, GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocument.from(client);

const USERS_TABLE = process.env.USERS_TABLE || "";

export async function handler(event: APIGatewayProxyEvent) {
    console.log(`Event recieved: ${JSON.stringify(event, null, 2)}`);

    const routeKey = `${event.httpMethod} ${event.resource}`;

    try {
        switch (routeKey) {
            default:
                return {
                    Message: "Unsupported route",
                    statusCode: 400,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    }
                };
            case "GET /users":
                const scanResponse = new ScanCommand({TableName: USERS_TABLE, Select: "ALL_ATTRIBUTES"});
                const sData = await ddbDocClient.send(scanResponse);
                return {
                    Message: sData.Items,
                    statusCode: 200,
                };
            case "GET /users/{userid}":
                const getResponse = new GetCommand({TableName: USERS_TABLE, Key: {userid: `${event.pathParameters?.userid}`}});
                const gData = await ddbDocClient.send(getResponse);
                return {
                    Message: gData.Item ?? "",
                    ...(gData.Item ? { statusCode: 200 } : {})
                };
            case "DELETE /users/{userid}":
                const delResponse = new DeleteCommand({TableName: USERS_TABLE, Key: {userid: `${event.pathParameters?.userid}`}});
                const dData = await ddbDocClient.send(delResponse);
                return {
                    Message: {},
                    statusCode: 200,
                };
            case "POST /users":
                const requestJson = JSON.parse(event?.body ?? "{}");
                requestJson.timestamp = new Date().toISOString();
                !("userid" in requestJson) ? requestJson.userid = crypto.randomUUID() : requestJson.userid;
                const updateResponse = new PutCommand({TableName: USERS_TABLE, Item: requestJson });
                const uData = await ddbDocClient.send(updateResponse);
                return {
                    Message: requestJson,
                    statusCode: 200,
                };
        }
    } catch (error) {
        throw error
    }
}
