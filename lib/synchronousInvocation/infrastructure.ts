import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Aws,Tags} from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from  'path';
import * as api from 'aws-cdk-lib/aws-apigateway';

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
        code: lambda.Code.fromAsset(path.join(__dirname, "../../assets/dist/UsersFunction/")), // always point to dist, you need the compiled js code!
        tracing: lambda.Tracing.ACTIVE,
        environment: {
           "USERS_TABLE": usersTable.tableName,
        },
    });

    usersTable.grantReadData(usersFunction);

    const usersApi = new api.RestApi(this, "UsersAPI", {
        restApiName: "Users Api",
        cloudWatchRole: true,
        deployOptions: {
            stageName: "prod",
            loggingLevel: api.MethodLoggingLevel.INFO,
            dataTraceEnabled: true,
            metricsEnabled: true,
            tracingEnabled: true,
        },
        deploy: true,
    });

    const users = usersApi.root.addResource("users");
    users.addMethod("GET", new api.LambdaIntegration(usersFunction));
    users.addMethod("POST", new api.LambdaIntegration(usersFunction));

    const user = users.addResource("{userid}");
    user.addMethod("GET", new api.LambdaIntegration(usersFunction));
    user.addMethod("PUT", new api.LambdaIntegration(usersFunction));
    user.addMethod("DELETE", new api.LambdaIntegration(usersFunction));

    Tags.of(usersFunction).add('Stack', `${Aws.STACK_NAME}`);
    Tags.of(usersApi).add('Name', `${Aws.STACK_NAME}-api`);
    Tags.of(usersApi).add('Stack', `${Aws.STACK_NAME}`);

    new cdk.CfnOutput(this, "UsersApi", {
        value: usersApi.url,
    });

    new cdk.CfnOutput(this, "lambdaUsersFunction", {
        value: usersFunction.functionName,
    });

    new cdk.CfnOutput(this, "UsersTableOutput", {
        value: usersTable.tableName,
    });
  }
}

