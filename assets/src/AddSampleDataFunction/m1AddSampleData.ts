import { DynamoDBDocument, BatchWriteCommand } from "@aws-sdk/lib-dynamodb"; // ES6 import
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDB({});
const ddbDocClient = DynamoDBDocument.from(client);

const tableName = "serverless_workshop_intro";

export async function handler(event: any) {
    console.log(`Event recieved ${JSON.stringify(event, null, 2)}`);

    const people = [
        { userid: "pamprz", name: "Pamela Perez" },
        { userid: "k3vwd", name: "Kevin Diaz" },
        { userid: "dondas", name: "Kali Diaz" },
    ];

    try {
        for (let i = 0; i < people.length; i++) {
            const command = new BatchWriteCommand({
                RequestItems: {
                    serverless_workshop_intro: [
                        {
                            PutRequest: {
                                Item: {
                                    _id: randomUUID(),
                                    UserId: people[i].userid,
                                    FullName: people[i].name,
                                },
                            },
                        },
                    ],
                },
            });
            const response = await ddbDocClient.send(command);
            console.log(`Response: ${response} > Batch writing: ${people[i].userid}`);
        }
        const result = `Success added ${people.length} people to ${tableName}`
        return result;
    } catch (error) {
        throw error;
    }

}
