import { Handler } from "aws-lambda";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb"; // ES6 import

const client = new DynamoDBClient();
const ddbDocClient = DynamoDBDocument.from(client);
const tableName = "serverless_workshop_intro";

export async function handler(event: Handler) {
    try {
        const command = new ScanCommand({
            TableName: tableName,
        });

        const response = await ddbDocClient.send(command);
        return response.Items;
    } catch (error) {
        throw error;
    }
};
