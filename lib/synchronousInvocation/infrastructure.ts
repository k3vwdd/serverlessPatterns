import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Aws } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from  'path';

export class SynchronousInvocationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const usersTable = new dynamodb.Table(this, "UsersTableConId", {
        partitionKey: {
            name: "userid",
            type: dynamodb.AttributeType.STRING,
        },
        tableName: `${Aws.STACK_NAME}-Users`,
    });

    const  usersFunction = new lambda.Function(this, "UsersFunction", {
        functionName: "UsersFunction",
        description: "Lambda function used to perform actions on the users data",
        runtime: lambda.Runtime.NODEJS_22_X,
        timeout: cdk.Duration.seconds(60),
        memorySize: 128,
        handler: "users.handler",
        code: lambda.Code.fromAsset(path.join(__dirname, "../../assets/src/UsersFunction/")),
        environment: {
           "TABLE_NAME": usersTable.tableName,
        },
    });

    new cdk.CfnOutput(this, "UsersTableOutput", {
        value: usersTable.tableName,
    });
  }
}

