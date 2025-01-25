import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient();
const ddbDocClient = DynamoDBDocument.from(client);
const tableName = "serverless_workshop_intro";

export async function handler(event: APIGatewayProxyEvent) {
    try {
        const command = new ScanCommand({
            TableName: tableName,
        });
        const response = await ddbDocClient.send(command);
        return {
            statusCode: 200,
            body: JSON.stringify(response.Items),
        }
    } catch (error) {
        return {
            statusCode: 500,
            body: error,
        }
    }
};
