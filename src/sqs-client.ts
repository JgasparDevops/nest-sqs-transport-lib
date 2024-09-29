// sqs-client.ts
import { ClientProxy, ReadPacket, WritePacket } from '@nestjs/microservices';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { Logger } from '@nestjs/common';

export class AWSSQSPubSubClient extends ClientProxy {
  private sqs: SQSClient;
  private readonly queueUrl: string;
  private logger = new Logger('SqsClient');

  constructor(queueUrl: string, region: string) {
    super();
    this.sqs = new SQSClient({ region });
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

    const command = new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify({ pattern, data }),
    });

    try {
      await this.sqs.send(command);
      console.log(`Mensaje enviado con patrón: ${pattern}`);
    } catch (error) {
      console.error(`Error al enviar el mensaje: ${error.message}`);
    }
  }
}
