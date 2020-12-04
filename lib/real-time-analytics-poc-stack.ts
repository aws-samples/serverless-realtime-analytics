import * as cdk from '@aws-cdk/core';
import * as api from '@aws-cdk/aws-apigateway';
import * as cognito from '@aws-cdk/aws-cognito';
import * as ddb from '@aws-cdk/aws-dynamodb';
import * as iam from '@aws-cdk/aws-iam';
import * as kfh from '@aws-cdk/aws-kinesisfirehose';
import * as kinesis from '@aws-cdk/aws-kinesis';
import * as lambda from '@aws-cdk/aws-lambda';
import * as lev from '@aws-cdk/aws-lambda-event-sources';
import * as logs from '@aws-cdk/aws-logs';
import * as s3 from '@aws-cdk/aws-s3';

export class RealTimeAnalyticsPocStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create log group for PoC.
    const logGroup = new logs.LogGroup(this, 'poc-log-group', {
      logGroupName: '/realtime/analytics/',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      retention: logs.RetentionDays.FIVE_DAYS
    });

    // Define the cognito user pool.
    const userPool = new cognito.UserPool(this, 'analytics-user-pool', {
      accountRecovery: cognito.AccountRecovery.PHONE_AND_EMAIL,
      passwordPolicy: {
        minLength: 8,
        requireDigits: true,
        requireLowercase: true,
        requireUppercase: true,
        tempPasswordValidity: cdk.Duration.days(7)
      },
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: true
      }
    });

    // Create the AppClient to use in the API.
    const appClient = userPool.addClient('api-client', {
      userPoolClientName: 'AnalyticsAPI'
    });

    // Create the identity pool.
    const identityPool = new cognito.CfnIdentityPool(this, 'analytics-identity-pool', {
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [{
        clientId: appClient.userPoolClientId,
        providerName: userPool.userPoolProviderName
      }]
    });

    // Create the RAW bucket to store all data.
    const rawDataBucket = new s3.Bucket(this, 'raw-data-bucket', {
      accessControl: s3.BucketAccessControl.PRIVATE,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // Create the DynamoDB table.
    const analyticsTable = new ddb.Table(this, 'analytics-table', {
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        name: 'instrument',
        type: ddb.AttributeType.NUMBER
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // Create the kinesis stream.
    const dataStream = new kinesis.Stream(this, 'real-time-stream', {
      retentionPeriod: cdk.Duration.days(2),
      shardCount: 10
    });

    // Create the Kinesis Firehose log stream.
    const firehoseLogStream = new logs.LogStream(this, 'kinesis-firehose-log', {
      logGroup: logGroup,
      logStreamName: 'firehose-stream',
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // Create the Kinesis Firehose stream role.
    const firehoseRole = new iam.Role(this, 'firehose-role', {
      assumedBy: new iam.ServicePrincipal('firehose.amazonaws.com'),
      description: 'Role used by Kinesis Firehose to have access to the S3 bucket.',
      inlinePolicies: {
        's3-policy': new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                's3:AbortMultipartUpload',
                's3:GetBucketLocation',
                's3:GetObject',
                's3:ListBucket',
                's3:ListBucketMultipartUploads',
                's3:PutObject'
              ],
              effect: iam.Effect.ALLOW,
              resources: [
                rawDataBucket.bucketArn,
                rawDataBucket.bucketArn + '/*'
              ]
            })
          ]
        }),
        'kinesis-policy': new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                'kinesis:DescribeStream',
                'kinesis:GetShardIterator',
                'kinesis:GetRecords',
                'kinesis:ListShards'
              ],
              effect: iam.Effect.ALLOW,
              resources: [
                dataStream.streamArn
              ]
            })
          ]
        }),
        'cloudwatch': new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                'logs:PutLogEvents'
              ],
              effect: iam.Effect.ALLOW,
              resources: [
                logGroup.logGroupArn + ':log-stream:' + firehoseLogStream.logStreamName
              ]
            })
          ]
        })
      }
    });

    // Create the actual Firehose Stream.
    const firehoseStream = new kfh.CfnDeliveryStream(this, 'analytics-firehose-stream', {
      deliveryStreamName: 'analytics-ingestion-fh',
      deliveryStreamType: 'KinesisStreamAsSource',
      kinesisStreamSourceConfiguration: {
        kinesisStreamArn: dataStream.streamArn,
        roleArn: firehoseRole.roleArn
      },
      s3DestinationConfiguration: {
        bucketArn: rawDataBucket.bucketArn,
        bufferingHints: {
          intervalInSeconds: 60,
          sizeInMBs: 100
        },
        cloudWatchLoggingOptions: {
          logGroupName: logGroup.logGroupName,
          logStreamName: firehoseLogStream.logStreamName
        },
        compressionFormat: 'Snappy',
        encryptionConfiguration: {
          noEncryptionConfig: 'NoEncryption'
        },
        errorOutputPrefix: 'failed-data/',
        prefix: 'ingested-data/',
        roleArn: firehoseRole.roleArn
      }
    });

    // Create the role for the Ingestion Lambda.
    const ingestLambdaRole = new iam.Role(this, 'ingest-lambda-role', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Execution role for the data ingestion Lambda.',
      inlinePolicies: {
        'dynamodb': new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                'dynamodb:UpdateItem'
              ],
              effect: iam.Effect.ALLOW,
              resources: [
                analyticsTable.tableArn
              ]
            })
          ]
        }),
        'kinesis-policy': new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                'kinesis:DescribeStream',
                'kinesis:GetShardIterator',
                'kinesis:GetRecords',
                'kinesis:ListShards'
              ],
              effect: iam.Effect.ALLOW,
              resources: [
                dataStream.streamArn
              ]
            })
          ]
        })
      },
      managedPolicies: [
        iam.ManagedPolicy.fromManagedPolicyArn(this, 'aws-lambda-basic',
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole')
      ]
    });

    // Create the ingestion Lambda
    const ingestLambda = new lambda.Function(this, 'data-ingestion-lambda', {
      code: new lambda.AssetCode('functions/ingest_data'),
      environment: {
        'ANALYTICS_TABLE': analyticsTable.tableName
      },
      events: [
        new lev.KinesisEventSource(dataStream, {
          batchSize: 100,
          bisectBatchOnError: true,
          parallelizationFactor: 2,
          retryAttempts: 2,
          startingPosition: lambda.StartingPosition.LATEST
        })
      ],
      handler: 'app.lambda_handler',
      role: ingestLambdaRole,
      runtime: lambda.Runtime.PYTHON_3_8
    });

    // Create role for query lambda
    const queryLambdaRole = new iam.Role(this, 'query-lambda-role', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Execution role for the query lambda.',
      inlinePolicies: {
        'dynamodb': new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                'dynamodb:GetItem',
                'dynamodb:Scan'
              ],
              effect: iam.Effect.ALLOW,
              resources: [
                analyticsTable.tableArn
              ]
            })
          ]
        })
      },
      managedPolicies: [
        iam.ManagedPolicy.fromManagedPolicyArn(this, 'aws-lambda-query-basic',
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole')
      ]
    });

    // Create the query lambda function.
    const queryLambda = new lambda.Function(this, 'api-lambda', {
      code: new lambda.AssetCode('functions/query_data'),
      environment: {
        'ANALYTICS_TABLE': analyticsTable.tableName
      },
      handler: 'app.lambda_handler',
      role: queryLambdaRole,
      runtime: lambda.Runtime.PYTHON_3_8
    });

    // Create the API Gateway to host the query lambda.
    const analyticsApi = new api.RestApi(this, 'analytics-api', {
      description: 'Analytics query API.',
      defaultCorsPreflightOptions: {
        allowCredentials: true,
        allowHeaders: ['*'],
        allowMethods: ['GET'],
        allowOrigins: ['*'],
        statusCode: 200
      }
    });

    // Create the resource on which the lambda will be called.
    const dataResource = analyticsApi.root.addResource('data');

    // Create the method to add the lambda.
    const getDataMethod = dataResource.addMethod('GET',
      new api.LambdaIntegration(queryLambda, {
        proxy: true
      }));

    // Create the authorizer for the lambda.
    const apiAuthorizer = new api.CfnAuthorizer(this, 'analytics-authorizer', {
      identitySource: 'method.request.header.Authorization',
      identityValidationExpression: 'Bearer (.*)',
      name: 'AnalyticsAuthorizer-' + cdk.Aws.ACCOUNT_ID,
      providerArns: [userPool.userPoolArn],
      restApiId: analyticsApi.restApiId,
      type: 'COGNITO_USER_POOLS'
    });

    new cdk.CfnOutput(this, 'identity-pool-id', {
      description: 'IdentityPoolId',
      value: identityPool.ref
    });

    new cdk.CfnOutput(this, 'region', {
      description: 'Cognito Region',
      value: cdk.Aws.REGION
    });

    new cdk.CfnOutput(this, 'user-pool-id', {
      description: 'UserPoolId',
      value: userPool.userPoolId
    });

    new cdk.CfnOutput(this, 'user-pool-web-client-id', {
      description: 'UserPoolWebClientId',
      value: appClient.userPoolClientId
    });

    new cdk.CfnOutput(this, 'api-endpoint', {
      description: 'API Gateway URL',
      value: analyticsApi.url
    });
  }
}
