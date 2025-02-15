# Fargate Scheduler Demo

Do you need to have a non-business critical web app that requires a server on AWS, but also it won't be used during certain times of the day? Do you want to save some money?

This is a solution for this usecase that utilizes the following AWS services:

- Application Load Balancer
- Fargate (Spot instances)
- EventBridge Scheduler
- AWS Cloud Development Kit (CDK) for deployment

In this solution we heavily prefer Fargate Spot instances. There's also an EventBridge Scheduler schedule that shuts down the Fargate task during times of non usage and turns the task on during regular usage times.

## How to run

### Prerequisites

1. Install Node.js
2. Ensure you have an AWS account, install the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html), and [configure your credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html)

### Deployment

1. Clone the repo
2. Run `npm install`
3. Install and configure the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html)
4. Run `npm run deploy`

### Info

- The URL to access the example web app will be output to the console at the end of the prior step
- It will not work if the service is shut down
- The example configures two schedules 1. Turns the Fargate task on Mon - Fri at 9am PT 2. Turns the Fargate task off Mon - Fri at 5pm PT.
- This is accomplished by setting the [desired count](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/service_definition_parameters.html#sd-desiredcount) number to `0` for off and `1` for on. You can set the desired count to more than `1`...this is just for demo purposes.
- The schedules are utilizing [universal targets](https://docs.aws.amazon.com/scheduler/latest/UserGuide/managing-targets-universal.html), so no need to Lambda (or other compute). Under the hood, EventBridge is executing the `aws ecs update-service --cluster <clusterName> --service <serviceName> --desired-count <number>` [CLI command](https://awscli.amazonaws.com/v2/documentation/api/latest/reference/ecs/update-service.html).

## Architecture diagram

Coming soon ™️
