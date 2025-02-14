#!/usr/bin/env node
import { App } from 'aws-cdk-lib'
import { FargateSchedulerDemoStack } from '../lib/fargate-scheduler-demo-stack'

const app = new App()

new FargateSchedulerDemoStack(app, 'FargateSchedulerDemoStack', {
  description:
    'This is a CDK stack for deploying a Fargate task that runs on a schedule',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
})
