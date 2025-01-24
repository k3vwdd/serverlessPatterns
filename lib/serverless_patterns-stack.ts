import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

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


  }
}
