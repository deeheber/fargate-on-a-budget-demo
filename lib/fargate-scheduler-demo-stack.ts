import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns'
import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import {
  Cluster,
  ContainerImage,
  FargateTaskDefinition,
  LogDrivers,
} from 'aws-cdk-lib/aws-ecs'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'
import { Vpc } from 'aws-cdk-lib/aws-ec2'

export class FargateSchedulerDemoStack extends Stack {
  readonly id: string

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)
    this.id = id

    this.buildApplicationLoadBalancedFargateService()
    // TODO:
    // Build EventBridge scheduler to shut the service off/on
  }

  private buildApplicationLoadBalancedFargateService() {
    const vpc = new Vpc(this, `${this.id}-vpc`, {
      vpcName: `${this.id}-vpc`,
      maxAzs: 2,
    })

    const cluster = new Cluster(this, `${this.id}-cluster`, {
      clusterName: `${this.id}-cluster`,
      vpc,
    })

    const taskDefinition = new FargateTaskDefinition(
      this,
      `${this.id}-task-def`,
      {
        cpu: 256,
        memoryLimitMiB: 512,
      }
    )
    taskDefinition.addContainer(`${this.id}-container`, {
      containerName: `${this.id}-container`,
      image: ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
      logging: LogDrivers.awsLogs({
        streamPrefix: `${this.id}`,
        logGroup: new LogGroup(this, `/ecs/${this.id}-container`, {
          logGroupName: `${this.id}-log-group`,
          retention: RetentionDays.ONE_WEEK,
          removalPolicy: RemovalPolicy.DESTROY,
        }),
      }),
      portMappings: [
        {
          containerPort: 80,
        },
      ],
      // Allows for a Fargate spot graceful shutdown
      stopTimeout: Duration.seconds(120),
    })

    const service = new ApplicationLoadBalancedFargateService(
      this,
      `${this.id}-service`,
      {
        assignPublicIp: true,
        capacityProviderStrategies: [
          {
            capacityProvider: 'FARGATE_SPOT',
            weight: 50,
          },
          // Backup in case FARGATE_SPOT is not available
          {
            capacityProvider: 'FARGATE',
            weight: 1,
          },
        ],
        cluster,
        circuitBreaker: {
          enable: true,
          rollback: true,
        },
        desiredCount: 1,
        minHealthyPercent: 100,
        taskDefinition,
      }
    )

    // Allow shorter de-registration to seperate the LB from Fargate instance in the case of a spot shutdown
    // Mostly just needs to be less than 2 minutes
    service.targetGroup.setAttribute(
      'deregistration_delay.timeout_seconds',
      '30'
    )
  }
}
