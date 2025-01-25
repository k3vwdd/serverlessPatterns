import * as cdk from 'aws-cdk-lib';
import { ServerlessPatternsStack } from '../lib/serverless_patterns-stack';
import { SynchronousInvocationStack } from '../lib/synchronousInvocation/infrastructure';

const app = new cdk.App();
new ServerlessPatternsStack(app, 'ServerlessPatternsStack', {});
new SynchronousInvocationStack(app, 'SynchronousInvocationStack', {});


