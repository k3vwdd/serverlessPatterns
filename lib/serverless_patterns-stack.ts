import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import * as api from 'aws-cdk-lib/aws-apigateway';
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam';

export class ServerlessPatternsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const usersTable = new dynamodb.Table(this, "dbUsersTable", {
        partitionKey: {
            name: "_id",
            type: dynamodb.AttributeType.STRING
        },
        tableName: "serverless_workshop_intro",
        removalPolicy: cdk.RemovalPolicy.DESTROY,
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

    const getUsersIntegration = new api.LambdaIntegration(readData);

    const restApi = new api.RestApi(this, "ServerlessApi", {
        restApiName: "ServerlessREST",
        cloudWatchRole: true,
        deployOptions: {
            stageName: "v1",
            loggingLevel: api.MethodLoggingLevel.INFO,
            dataTraceEnabled: true,
            metricsEnabled: true,
            tracingEnabled: true,
        },
        deploy: true,
    });

    const usersApiResource = restApi.root.addResource("users");
    usersApiResource.addMethod("GET", getUsersIntegration);
    readData.addPermission('PermitAPIGInvocation', {
        principal: new ServicePrincipal('apigateway.amazonaws.com'),
    });

    usersTable.grantReadData(readData);
    usersTable.grantFullAccess(m1AddSampleData);
  }
}
