import { CustomTransportStrategy, Server } from '@nestjs/microservices';
import * as AWS from 'aws-sdk';

export class AWSSQSPubSubServer
  extends Server
  implements CustomTransportStrategy
{
  private sqs: AWS.SQS;
  private readonly queueUrl: string;

  constructor(queueUrl: string, region: string) {
    super();
    this.sqs = new AWS.SQS({ region });
    this.queueUrl = queueUrl;
  }

  async listen(callback: () => void) {
    console.log(`Listening for messages on queue: ${this.queueUrl}`);
    console.log('Map handler size', this.messageHandlers.size);
    this.messageHandlers.forEach((handler, pattern) => {
      console.log(`Handler registered for pattern: ${pattern}`);
    });
    await this.pollMessages();
    callback();
  }

  close() {
    console.log('Closing SQS server...');
  }

  private async pollMessages() {
    const params = {
      QueueUrl: this.queueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 20,
    };

    try {
      const response = await this.sqs.receiveMessage(params).promise();
      if (response.Messages && response.Messages.length > 0) {
        for (const message of response.Messages) {
          const parsedMessage = JSON.parse(message.Body);

          this.handleMessage(parsedMessage);

          await this.sqs
            .deleteMessage({
              QueueUrl: this.queueUrl,
              ReceiptHandle: message.ReceiptHandle,
            })
            .promise();
          console.log('Message was delete succesfull');
        }
      }
    } catch (error) {
      console.error('Error al recibir mensajes de SQS', error);
    }

    setTimeout(() => this.pollMessages(), 1000);
  }

  private handleMessage(message: any) {
    const handler = this.getHandlerByPattern(message.pattern);
    if (handler) {
      handler(message.data)
        .then(() => {
          console.log(`Mensaje procesado con éxito: ${message.pattern}`);
        })
        .catch((error) => {
          console.error(`Error al procesar el mensaje: ${error}`);
        });
    } else {
      console.warn(`No handler found for pattern: ${message.pattern}`);
    }
  }
}
