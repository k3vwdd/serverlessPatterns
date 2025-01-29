import { Context, APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DeleteCommand, DynamoDBDocument, GetCommand, PutCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { error } from "console";
import { errorCode } from "aws-sdk/clients/ivs";
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocument.from(client);

const USERS_TABLE = process.env.USERS_TABLE || "";

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
        const item = response?.Items ?? "";
        if (item.length > 0) {
            return {
                statusCode: 200,
                //headers: { ...defaultHeaders },
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
async function deleteUser(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const userId = event.pathParameters?.userid ?? "" ;
    console.log(userId)
    try {
        const response = await ddbDocClient.send(new GetCommand({
            TableName: USERS_TABLE,
            Key: {
                userid: userId,
            },
        }))
        if (!response.Item) {
            return {
                statusCode: 200,
                headers: { ...defaultHeaders },
                body: `${userId} doesn't exist in database`
            }
        } else {
            await ddbDocClient.send(new DeleteCommand({
                TableName: USERS_TABLE,
                Key: {
                    userid: userId,
                },
            }));
            return {
                statusCode: 200,
                headers: { ...defaultHeaders },
                body: JSON.stringify(`${userId} deleted`),
            }
        }
    } catch (error) {
        throw error;
    };
};

async function getUsers(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    let result, ExclusiveStartKey;
    let accumulated: Record<string, any>[] | undefined;
    try {
        do {
            result = await ddbDocClient.send(new ScanCommand({
                TableName: USERS_TABLE,
                ExclusiveStartKey,
                Limit: 10,
            }));
            accumulated = [...accumulated ?? [], ...result.Items ?? []]
            ExclusiveStartKey = result.LastEvaluatedKey;
        } while (result.LastEvaluatedKey);

        return {
            statusCode: 200,
            headers: {...defaultHeaders},
            body: JSON.stringify(accumulated),
        }
    } catch (error) {
        throw error;
    }
};


export async function getUser(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
   const userid = event.pathParameters?.userid
   try {
        const response = await ddbDocClient.send(new GetCommand({
            TableName: USERS_TABLE,
            Key: {
                userid: userid,
            }
        }));
        if (!response.Item) {
            return {
                statusCode: 200,
                headers: {...defaultHeaders},
                body: JSON.stringify("userid not found"),
            }
        }
        return {
            statusCode: 200,
            headers: {...defaultHeaders},
            body: JSON.stringify(response.Item),
        }
   } catch (error) {
       throw error;
   }
}

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    console.log(`Event recieved: ${JSON.stringify(event, null, 2)}`);
    const routeKey = `${event.httpMethod} ${event.resource}`;

    try {
        switch (routeKey) {
            case UserRoutes.CREATE_USER:
                 return await createUser(event);
            case UserRoutes.DELETE_USER:
                 return await deleteUser(event);
            case UserRoutes.GET_USERS:
                return await getUsers(event);
            case UserRoutes.GET_USER:
                return await getUser(event)
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
