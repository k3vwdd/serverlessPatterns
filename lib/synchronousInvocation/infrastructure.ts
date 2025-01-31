import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Aws,Tags} from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cognito from 'aws-cdk-lib/aws-cognito';
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
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    usersTable.addGlobalSecondaryIndex({
        indexName: "username",
        partitionKey: {
            name: "username",
            type: dynamodb.AttributeType.STRING,
        }});

    const usersFunction = new lambda.Function(this, "UsersFunction", {
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
    usersTable.grantWriteData(usersFunction);

    const userPool = new cognito.UserPool(this, "user-pool", {
        userPoolName: `${Aws.STACK_NAME}-user-pool`,
        selfSignUpEnabled: true,
        signInAliases: { email: true },
        autoVerify: { email: true },
        standardAttributes: {
            email: {
                required: true,
                mutable: true,
            },
            fullname: {
                required: true,
                mutable: true,
            },
        },
        removalPolicy: cdk.RemovalPolicy.DESTROY,
    });


    const userPoolClient = userPool.addClient('user-pool-client', {
      userPoolClientName: `${Aws.STACK_NAME}-user-pool-client`,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      preventUserExistenceErrors: true,
      refreshTokenValidity: cdk.Duration.days(30),
      supportedIdentityProviders: [cognito.UserPoolClientIdentityProvider.COGNITO],
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID
        ],
        callbackUrls: [ 'http://localhost' ],
      }
    });

    const apiAdminGroupName = new cdk.CfnParameter(this, "api-admin-group-name",{
        type: "String",
        description: 'User pool group name for API adminstrators',
            default: "apiAdmins",
    });

    const userPoolClientId = userPoolClient.userPoolClientId;

    userPool.addDomain('user-pool-domain', {
        cognitoDomain: {
            domainPrefix: `${userPoolClientId}`,
        }
    });

    const adminGroup = new cognito.CfnUserPoolGroup(this, "api-admin-group", {
        description: 'User group for API Administrators',
            groupName: apiAdminGroupName.valueAsString,
        precedence: 0,
        userPoolId: userPool.userPoolId,
    });

    const  authorizerFunction = new lambda.Function(this, "AuthMeDaddy", {
        functionName: "AuthMeDaddy",
        description: "Function to auth users with jwt for my api, it'll check the cognito user group policy",
            runtime: lambda.Runtime.NODEJS_22_X,
        timeout: cdk.Duration.seconds(60),
        memorySize: 128,
        handler: "index.handler",
        code: lambda.Code.fromAsset(path.join(__dirname, "../../assets/dist/Authorizer/")), // always point to dist, you need the compiled js code!
        tracing: lambda.Tracing.ACTIVE,
        environment: {
            USER_POOL_ID: userPool.userPoolId,
            APPLICATION_CLIENT_ID: userPoolClient.userPoolClientId,
            ADMIN_GROUP_NAME: adminGroup.groupName ?? "",

        },
    });

    const authorizer = new api.TokenAuthorizer(this, "apiAuthorizer", {
        handler: authorizerFunction,
    });

    const usersApi = new api.RestApi(this, "UsersAPI", {
        defaultMethodOptions: { authorizer },
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
    Tags.of(authorizerFunction).add('Stack', `${Aws.STACK_NAME}`);
    Tags.of(usersApi).add('Name', `${Aws.STACK_NAME}-api`);
    Tags.of(usersApi).add('Stack', `${Aws.STACK_NAME}`);
    Tags.of(userPool).add('Name', `${Aws.STACK_NAME}-user-pool`);

    new cdk.CfnOutput(this, "AuthFunction", {
        value: usersApi.url,
    });

    new cdk.CfnOutput(this, "UsersApi", {
        value: usersApi.url,
    });

    new cdk.CfnOutput(this, "lambdaUsersFunction", {
        value: usersFunction.functionName,
    });

    new cdk.CfnOutput(this, "UsersTableOutput", {
        value: usersTable.tableName,
    });

      new cdk.CfnOutput(this, 'UserPool', {
      description: 'Cognito User Pool ID',
      value: userPool.userPoolId,
    });

    new cdk.CfnOutput(this, 'UserPoolClient', {
      description: 'Cognito User Pool Application Client ID',
      value: userPoolClientId,
    });

    new cdk.CfnOutput(this, 'UserPoolAdminGroupName ', {
      description: 'Cognito User Pool Admin Group Name',
      value: adminGroup.groupName || '',
    });

    new cdk.CfnOutput(this, 'CognitoLoginURL', {
      description: 'Cognito User Pool Application Client Hosted Login UI URL',
      value: `https://${userPoolClientId}.auth.${Aws.REGION}.amazoncognito.com/login?client_id=${userPoolClientId}&response_type=code&redirect_uri=http://localhost`
    });

    new cdk.CfnOutput(this, 'CognitoAuthCommand', {
      description: 'AWS CLI command for Amazon Cognito User Pool authentication',
      value: `aws cognito-idp initiate-auth --auth-flow USER_PASSWORD_AUTH --client-id ${userPoolClientId} --auth-parameters USERNAME=<user@example.com>,PASSWORD=<password>`
    });
  }
}

