#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { RealTimeAnalyticsPocStack } from '../lib/real-time-analytics-poc-stack';
import { RealTimeAnalyticsWebStack } from "../lib/real-time-analytics-web-stack";

const app = new cdk.App();
new RealTimeAnalyticsPocStack(app, 'RealTimeAnalyticsPocStack');
new RealTimeAnalyticsWebStack(app, 'RealTimeAnalyticsWebStack');
