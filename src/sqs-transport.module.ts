import { DynamicModule, Module } from '@nestjs/common';
import { AWSSQSPubSubServer } from './sqs-server';
import { AWSSQSPubSubClient } from './sqs-client';

@Module({})
export class SqsTransportModule {
  static register(queueUrl: string, region: string): DynamicModule {
    return {
      module: SqsTransportModule,
      providers: [
        {
          provide: 'SQS_SERVER',
          useFactory: () => new AWSSQSPubSubServer(queueUrl, region),
        },
        {
          provide: 'SQS_CLIENT',
          useFactory: () => new AWSSQSPubSubClient(queueUrl, region),
        },
      ],
      exports: ['SQS_SERVER', 'SQS_CLIENT'],
    };
  }
}
