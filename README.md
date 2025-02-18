# Fargate On A Budget Demo

[Companion blog post that goes along with this example repo](https://danielleheberling.xyz/blog/fargate-on-a-budget/)

Do you need to have a non-business critical web app that requires a server on AWS, but also it won't be used during certain times of the day? Do you want to save some money?

This is a solution for this usecase that utilizes the following AWS services:

- [Application Load Balancer](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/introduction.html)
- [Fargate (Spot instances)](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/fargate-capacity-providers.html)
- [EventBridge Scheduler](https://docs.aws.amazon.com/scheduler/latest/UserGuide/what-is-scheduler.html)
- [AWS Cloud Development Kit for TypeScript](https://docs.aws.amazon.com/cdk/v2/guide/home.html) - for infrastructure as code based deployment

In this solution we heavily prefer Fargate Spot instances. There's also an EventBridge Scheduler schedule that shuts down the Fargate task during times of non usage and turns the task on during regular usage times.

## How to run

### Prerequisites

1. Install [Node.js](https://nodejs.org/en) - the desired version number can be found in the `.nvmrc` file at the root of this repo
2. Ensure you have an AWS account, install the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html), and [configure your credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html)

### Deployment

1. Clone the repo
2. Run `npm install`
3. Configure the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) for the account you'd like to deploy into
4. Run `npm run deploy`

### Info

- The URL to access the example web app will be output to the console at the end of the prior step
- It will not work if the service is shut down
- The URL exposed by the load balancer in this example is **open to the public internet**. Please ensure that if you are using this as a template for an application that contains private information to include authentication or tweak it to protect the endpoint from public access.
- The example configures two schedules 1. Turns the Fargate task on Mon - Fri at 9am PT 2. Turns the Fargate task off Mon - Fri at 5pm PT.
- This is accomplished by setting the [desired count](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/service_definition_parameters.html#sd-desiredcount) number to `0` for off and `1` for on. You can set the desired count to more than `1`...this is just for demo purposes.
- The schedules are utilizing [universal targets](https://docs.aws.amazon.com/scheduler/latest/UserGuide/managing-targets-universal.html), so there is no need for Lambda (or other compute). Under the hood, EventBridge is executing the `aws ecs update-service --cluster <clusterName> --service <serviceName> --desired-count <number>` [CLI command](https://awscli.amazonaws.com/v2/documentation/api/latest/reference/ecs/update-service.html).

## Architecture diagram

<img width="882" alt="Screenshot 2025-02-14 at 16 37 39" src="https://github.com/user-attachments/assets/4e1482ff-8c52-4181-8ad3-d5e1eecdad0b" />
