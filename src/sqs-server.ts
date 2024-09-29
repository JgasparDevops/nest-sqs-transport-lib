import { CustomTransportStrategy, Server } from '@nestjs/microservices';
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs';

export class AWSSQSPubSubServer
  extends Server
  implements CustomTransportStrategy
{
  private sqs: SQSClient;
  private readonly queueUrl: string;

  constructor(queueUrl: string, region: string) {
    super();
    this.sqs = new SQSClient({ region });
    this.queueUrl = queueUrl;
  }

  async listen(callback: () => void) {
    this.logger.log(`Listening for messages on queue: ${this.queueUrl}`);
    this.logger.log('Map handler size', this.messageHandlers.size);
    this.messageHandlers.forEach((handler, pattern) => {
      this.logger.log(`Handler registered for pattern: ${pattern}`);
    });
    await this.pollMessages();
    callback();
  }

  close() {
    this.logger.log('Closing SQS server...');
  }

  private async pollMessages() {
    const command = new ReceiveMessageCommand({
      QueueUrl: this.queueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 20,
    });

    try {
      const response = await this.sqs.send(command);
      if (response.Messages && response.Messages.length > 0) {
        for (const message of response.Messages) {
          const parsedMessage = JSON.parse(message.Body);

          this.handleMessage(parsedMessage);

          await this.deleteMessage(message.ReceiptHandle);
        }
      }
    } catch (error) {
      this.logger.error('Error al recibir mensajes de SQS', error);
    }

    setTimeout(() => this.pollMessages(), 1000);
  }

  async deleteMessage(receiptHandle: string): Promise<void> {
    try {
      const command = new DeleteMessageCommand({
        QueueUrl: this.queueUrl,
        ReceiptHandle: receiptHandle,
      });
      await this.sqs.send(command);
      this.logger.log('Mensaje eliminado con éxito.');
    } catch (error) {
      this.logger.error('Error eliminando mensaje de SQS', error);
      throw error;
    }
  }

  private handleMessage(message: any) {
    const handler = this.getHandlerByPattern(message.pattern);
    if (handler) {
      handler(message.data)
        .then(() => {
          this.logger.log(`Mensaje procesado con éxito: ${message.pattern}`);
        })
        .catch((error) => {
          this.logger.error(`Error al procesar el mensaje: ${error}`);
        });
    } else {
      this.logger.warn(`No handler found for pattern: ${message.pattern}`);
    }
  }
}
