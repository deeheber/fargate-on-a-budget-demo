# Fargate Scheduler Demo

Do you need to have a non-business critical web app that requires a server on AWS, but also it won't be used during certain times of the day? Do you want to save some money?

This is a solution for this usecase that utilizes the following AWS services:

- Application Load Balancer
- Fargate (Spot instances)
- EventBridge Scheduler
- AWS Cloud Development Kit (CDK) for deployment

In this solution we heavily prefer Fargate Spot instances and have a Scheduler that shuts down the Fargate task during times of non usage.

## How to run

Coming soon ™️

## Architecture diagram

Coming soon ™️
