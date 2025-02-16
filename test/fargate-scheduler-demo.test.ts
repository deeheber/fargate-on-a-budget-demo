import { App } from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { FargateSchedulerDemoStack } from '../lib/fargate-scheduler-demo-stack'

test('Snapshot matches', () => {
  const app = new App()
  const stack = new FargateSchedulerDemoStack(app, 'MyTestStack')
  const template = Template.fromStack(stack)

  expect(template.toJSON()).toMatchSnapshot()
})
