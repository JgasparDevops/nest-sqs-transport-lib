// sqs-client.ts
import { ClientProxy, ReadPacket, WritePacket } from '@nestjs/microservices';
import * as AWS from 'aws-sdk';
import { Logger } from '@nestjs/common';

export class AWSSQSPubSubClient extends ClientProxy {
  private sqs: AWS.SQS;
  private readonly queueUrl: string;
  private logger = new Logger('SqsClient');

  constructor(queueUrl: string, region: string) {
    super();
    this.sqs = new AWS.SQS({ region });
    this.queueUrl = queueUrl;
  }

  async connect(): Promise<any> {}
  async close() {}

  publish(
    packet: ReadPacket<any>,
    callback: (packet: WritePacket<any>) => void,
  ) {
    return function () {};
  }

  async dispatchEvent(packet: ReadPacket<any>): Promise<any> {
    const { pattern, data } = packet;

    const params = {
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify({ pattern, data }),
    };

    try {
      await this.sqs.sendMessage(params).promise();
      console.log(`Mensaje enviado con patrón: ${pattern}`);
    } catch (error) {
      console.error(`Error al enviar el mensaje: ${error.message}`);
    }
  }
}
