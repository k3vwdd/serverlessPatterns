import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Aws } from 'aws-cdk-lib';

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

    new cdk.CfnOutput(this, "UsersTableOutput", {
        value: usersTable.tableName,
    });

  }
}

