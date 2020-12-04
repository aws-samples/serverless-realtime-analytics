import * as cdk from '@aws-cdk/core';
import * as cf from '@aws-cdk/aws-cloudfront';
import * as iam from '@aws-cdk/aws-iam';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3d from '@aws-cdk/aws-s3-deployment';

export class RealTimeAnalyticsWebStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create the bucket to host the web site.
    const webAppBucket = new s3.Bucket(this, 'web-app-bucket', {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: '404.html'
    });

    // Deploy the website.
    const deployment = new s3d.BucketDeployment(this, 'web-deployment', {
      sources: [s3d.Source.asset('web/dashboard/dist')],
      destinationBucket: webAppBucket
    });

    // Create the Origin Access Identity for the S3 Policy.
    const cloudFrontOia = new cf.OriginAccessIdentity(this, 'web-site-oia', {
      comment: 'OIA for real time analytics.'
    });

    // Create the Web Distribution.
    const webDistribution = new cf.CloudFrontWebDistribution(this, 'web-cf-distribution', {
      originConfigs: [{
        behaviors: [{
          isDefaultBehavior: true
        }],
        s3OriginSource: {
          originAccessIdentity: cloudFrontOia,
          s3BucketSource: webAppBucket
        }
      }]
    });

    // Create the Policy Document to gran access to the S3 bucket from CloudFront.
    const cfPolicy = new iam.PolicyStatement();
    cfPolicy.addActions('s3:GetBucket*', 's3:GetObject*', 's3:List*');
    cfPolicy.addResources(webAppBucket.bucketArn, webAppBucket.bucketArn + '/*')
    cfPolicy.addCanonicalUserPrincipal(cloudFrontOia.cloudFrontOriginAccessIdentityS3CanonicalUserId)
    webAppBucket.addToResourcePolicy(cfPolicy)

    new cdk.CfnOutput(this, 'cloud-front-url', {
      description: 'Cloud Front URL',
      value: webDistribution.distributionDomainName
    });
  }
}