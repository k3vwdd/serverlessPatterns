import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import * as iam from 'aws-cdk-lib/aws-iam';

export class ServerlessPatternsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const usersTable = new dynamodb.Table(this, "dbUsersTable", {
        partitionKey: {
            name: "_id",
            type: dynamodb.AttributeType.STRING
        },
        tableName: "serverless_workshop_intro",
    });

    const m1AddSampleData = new lambda.Function(this, "AddSampleDataFunction", {
        functionName: "m1AddSampleData",
        runtime: lambda.Runtime.NODEJS_22_X,
        timeout: cdk.Duration.seconds(60),
        memorySize: 128,
        handler: "m1AddSampleData.handler",
        code: lambda.Code.fromAsset(path.join(__dirname, "../assets/dist/AddSampleDataFunction/")),
    });

    const readData = new lambda.Function(this, "ReadDataFunction", {
        functionName: "get-users",
        runtime: lambda.Runtime.NODEJS_22_X,
        timeout: cdk.Duration.seconds(60),
        memorySize: 128,
        handler: "getUsers.handler",
        code: lambda.Code.fromAsset(path.join(__dirname, "../assets/dist/ReadDataFunction/")),
    });

    usersTable.grantReadData(readData);
    usersTable.grantFullAccess(m1AddSampleData);



  }
}
