import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns'
import {
  Cluster,
  ContainerImage,
  FargateService,
  FargateTaskDefinition,
  LogDrivers,
} from 'aws-cdk-lib/aws-ecs'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'
import { Vpc } from 'aws-cdk-lib/aws-ec2'
import { CfnSchedule } from 'aws-cdk-lib/aws-scheduler'
import {
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam'

export class FargateSchedulerDemoStack extends Stack {
  readonly id: string
  private service: FargateService
  private cluster: Cluster

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)
    this.id = id

    this.buildApplicationLoadBalancedFargateService()
    this.buildSchedules()
  }

  private buildApplicationLoadBalancedFargateService() {
    const vpc = new Vpc(this, `${this.id}-vpc`, {
      vpcName: `${this.id}-vpc`,
      maxAzs: 2,
    })

    this.cluster = new Cluster(this, `${this.id}-cluster`, {
      clusterName: `${this.id}-cluster`,
      vpc,
    })

    const taskDefinition = new FargateTaskDefinition(
      this,
      `${this.id}-task-def`,
      {
        cpu: 256,
        memoryLimitMiB: 512,
      },
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
        cluster: this.cluster,
        circuitBreaker: {
          enable: true,
          rollback: true,
        },
        desiredCount: 1,
        minHealthyPercent: 100,
        taskDefinition,
      },
    )
    this.service = service.service

    // Allow shorter de-registration to seperate the LB from Fargate instance in the case of a spot shutdown
    // Mostly just needs to be less than 2 minutes
    service.targetGroup.setAttribute(
      'deregistration_delay.timeout_seconds',
      '30',
    )
  }

  private buildSchedules() {
    const scheduleRole = new Role(this, `${this.id}-scheduler-role`, {
      assumedBy: new ServicePrincipal('scheduler.amazonaws.com'),
      roleName: `${this.id}-scheduler-role`,
      inlinePolicies: {
        ecsUpdateServicePolicy: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['ecs:UpdateService'],
              resources: [this.service.serviceArn],
            }),
          ],
        }),
      },
    })

    const schedules = [
      {
        name: `${this.id}-up`,
        desiredCount: 1,
        scheduleExpression: 'cron(0 9 ? * MON-FRI *)',
      },
      {
        name: `${this.id}-down`,
        desiredCount: 0,
        scheduleExpression: 'cron(0 17 ? * MON-FRI *)',
      },
    ]

    schedules.forEach(({ name, desiredCount, scheduleExpression }) => {
      new CfnSchedule(this, name, {
        description: `Sets the desired count of the ${this.service.serviceName} ECS service to ${desiredCount}`,
        name,
        flexibleTimeWindow: {
          mode: 'OFF',
        },
        scheduleExpression,
        scheduleExpressionTimezone: 'America/Los_Angeles',
        state: 'ENABLED',
        target: {
          arn: 'arn:aws:scheduler:::aws-sdk:ecs:updateService',
          roleArn: scheduleRole.roleArn,
          input: JSON.stringify({
            Cluster: `${this.cluster.clusterName}`,
            Service: `${this.service.serviceName}`,
            DesiredCount: desiredCount,
          }),
          retryPolicy: {
            maximumEventAgeInSeconds: 90,
            maximumRetryAttempts: 2,
          },
        },
      })
    })
  }
}
