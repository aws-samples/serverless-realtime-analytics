## Serverless Realtime Analytics

This application demonstrates how to create a realtime analytics serverless application using Amazon Kinesis Data Streams,
Amazon Kinesis Firehose, Amazon DynamoDB, AWS Lambda, Amazon API Gateway, Amazon Cognito, Amazon Simple Storage Service,
Amazon Cloudfront, AWS Amplify and AWS Cloud Development Kit.

- [Amazon Kinesis Data Streams](https://aws.amazon.com/kinesis) - We will use this service as it provides a serverless
  mechanism for realtime data ingestion, also, provides the flexibility to add a Lambda as a trigger and attach a
  Kinesis Firehose for data storage to S3.
- [Amazon Kinesis Firehose](https://aws.amazon.com/kinesis) - We will use this service to store the data ingested by the
  Data Stream for later analytics.
- [Amazon DynamoDB](https://aws.amazon.com/dynamodb) - Using DynamoDB we will have a Serverless and low latency database.
- [AWS Lambda](https://aws.amazon.com/lambda) - Here we will deploy the update and query lambda functions.
- [Amazon Simple Storage Service](https://aws.amazon.com/s3) - We will use a bucket to store all the data ingested for
  future analysis.
- [Amazon Cognito](https://aws.amazon.com/cognito) - We will create a user and identity pool in Cognito to secure our
  analytics application.
- [Amazon API Gateway](https://aws.amazon.com/apigateway) - API Gateway will be used as the Facade for our query lambda
  function and will secure the function using a Cognito Authenticator.
- [Amazon Cloudfront](https://aws.amazon.com/cloudfront) - We will create a distribution for our static content.
- [AWS Cloud Development Kit](https://aws.amazon.com/cdk) - Using AWS CDK we will create all the infrastructure needed
  for the project.
- [AWS Amplify](https://aws.amazon.com/amplify) - Using Amplify in our web application we will integrate it with Cognito
  and API Gateway.

## Pre requisites

To deploy this demo you need:

- An AWS account.
- A user with administrator privileges with a set of access keys.
- NodeJS
- The AWS CLI - https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html
- The CDK command - https://docs.aws.amazon.com/cdk/latest/guide/cli.html

**NOTES:**
- Don't forget to configure your CLI - https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html
- Don't forget to bootstrap your CDK environment - https://docs.aws.amazon.com/cdk/latest/guide/bootstrapping.html

## Architecture

This is an overview of all the components in the application architecture.

![Architecture](Architecture.png?raw=true "Architecture")

## Deployment

This application consists of two CDK stacks:
- RealTimeAnalyticsPocStack - This stack contains the most of the infrastructure and application.
  To deploy use the following commands:
  - ``$ npm run build``
  - ``$ cdk deploy RealTimeAnalyticsPocStack``

Sample output
![Output](CDK-Output.png?raw=true "CDK Output")
- RealTimeAnalyticsWebStack - This stack contains only the static web application, you will need to update the
  ``web/dashboard/src/main.js`` file with the outputs of the previous stack. Once updated:
  - ``$ cdk deploy RealTimeAnalyticsWebStack``

## Testing

To test the application we can use the project [Kinesis Data Generator](https://awslabs.github.io/amazon-kinesis-data-generator/web/producer.html).
Follow the instructions in the project page to deploy the tool.

You can use the following template for testing:
``session={{date.now('YYYYMMDD')}}|sequence={{date.now('x')}}|reception={{date.now('x')}}|instrument={{random.number(9)}}|l={{random.number(20)}}|price_0={{random.number({"min":10000, "max":30000})}}|price_1={{random.number({"min":10000, "max":30000})}}|price_2={{random.number({"min":10000, "max":30000})}}|price_3={{random.number({"min":10000, "max":30000})}}|price_4={{random.number({"min":10000, "max":30000})}}|price_5={{random.number({"min":10000, "max":30000})}}|price_6={{random.number({"min":10000, "max":30000})}}|price_7={{random.number({"min":10000, "max":30000})}}|price_8={{random.number({"min":10000, "max":30000})}}|``

## Clean Up

To clean up your account delete all files in the bucket created and run delete the CloudFormation stacks:
- ``$ cdk destroy RealTimeAnalyticsWebStack``
- ``$ cdk destroy RealTimeAnalyticsPocStack``

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.

