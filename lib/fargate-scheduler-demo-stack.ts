import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'

export class FargateSchedulerDemoStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    // TODO:
    // Build applicaton load balanced Fargate service
    // Build EventBridge scheduler to shut the service off/on
  }
}
