import { Context, APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DeleteCommand, DynamoDBDocument, GetCommand, PutCommand, ScanCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocument.from(client);

const USERS_TABLE = process.env.USERS_TABLE || "";
//const USERS_TABLE = "testUsers";

enum UserRoutes  {
    CREATE_USER = "POST /users",
        DELETE_USER = "DELETE /users/{userid}",
        GET_USER = "GET /users/{userid}",
        GET_USERS = "GET /users",
        UPDATE_USER = "PUT /users/{userid}",
}
const defaultHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
}


async function createUser(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        const body = JSON.parse(event?.body || "{}");
        console.log(body);
        let userName = body.username;
        const response = await ddbDocClient.send(new QueryCommand({
            TableName: USERS_TABLE,
            IndexName: "username",
            KeyConditionExpression: "username = :username",
            ExpressionAttributeValues: {":username": userName},
        }))
        if (response.Items?.length! > 0) {
            return {
                statusCode: 200,
                headers: { ...defaultHeaders },
                body: "User already in db"
            }
        } else {
            body['timestamp'] = new Date().toISOString();
            body['userid'] = crypto.randomUUID();
            await ddbDocClient.send(new PutCommand({
                TableName: USERS_TABLE,
                Item: {
                    ...body,
                },
                ConditionExpression: "attribute_not_exists(username)",
            }));
            return {
                statusCode: 201,
                headers: { ...defaultHeaders },
                body: JSON.stringify(body),
            }
        }
    } catch (error) {
        throw error;
    }
};

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    console.log(`Event recieved: ${JSON.stringify(event, null, 2)}`);
    const routeKey = `${event.httpMethod} ${event.resource}`;

    try {
        switch (routeKey) {
            case UserRoutes.CREATE_USER:
                 return await createUser(event);
            default:
                return {
                    statusCode: 400,
                    headers: { ...defaultHeaders },
                    body: JSON.stringify({
                        message: "Unsupported route",
                    }),
                }
            }
    } catch (error) {
        throw error
    }
}
