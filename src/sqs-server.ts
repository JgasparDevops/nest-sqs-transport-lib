import { CustomTransportStrategy, Server } from '@nestjs/microservices';
import * as AWS from 'aws-sdk';

export class AWSSQSPubSubServer
  extends Server
  implements CustomTransportStrategy
{
  /**
   * This method is triggered when you run "app.listen()".
   */

  private sqs: AWS.SQS;
  private readonly queueUrl: string;

  constructor(queueUrl: string, region: string) {
    super();
    this.sqs = new AWS.SQS({ region });
    this.queueUrl = queueUrl;
  }

  async listen(callback: () => void) {
    console.log(`Listening for messages on queue: ${this.queueUrl}`);
    console.log(this.messageHandlers);
    await this.pollMessages();
    callback();
  }

  /**
   * This method is triggered on application shutdown.
   */
  close() {
    console.log('Closing SQS server...');
  }

  private async pollMessages() {
    const params = {
      QueueUrl: this.queueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 20, // Long polling
    };

    try {
      const response = await this.sqs.receiveMessage(params).promise();
      if (response.Messages && response.Messages.length > 0) {
        for (const message of response.Messages) {
          const parsedMessage = JSON.parse(message.Body);
          console.log(parsedMessage);
          // Procesar el mensaje usando los manejadores registrados
          this.handleMessage(parsedMessage);

          // Borrar el mensaje de la cola después de procesarlo
          const deleteMessage = await this.sqs
            .deleteMessage({
              QueueUrl: this.queueUrl,
              ReceiptHandle: message.ReceiptHandle,
            })
            .promise();
          console.log(deleteMessage);
        }
      }
    } catch (error) {
      console.error('Error al recibir mensajes de SQS', error);
    }

    // Continuar haciendo polling
    setTimeout(() => this.pollMessages(), 1000);
  }

  private handleMessage(message: any) {
    const handler = this.getHandlerByPattern(message.pattern);
    console.log('this.getHandlers()', this.getHandlers());
    if (handler) {
      handler(message.data)
        .then((response) => {
          console.log(`Mensaje procesado con éxito: ${message.pattern}`);
        })
        .catch((error) => {
          console.error(`Error al procesar el mensaje: ${error.message}`);
        });
    } else {
      console.warn(`No handler found for pattern: ${message.pattern}`);
    }
  }
}

/*
import { Server, CustomTransportStrategy } from '@nestjs/microservices';
import * as AWS from 'aws-sdk';

export class SqsServer extends Server implements CustomTransportStrategy {
  private sqs: AWS.SQS;
  private readonly queueUrl: string;

  constructor(queueUrl: string) {
    super();
    this.sqs = new AWS.SQS({ region: 'us-east-1' });
    this.queueUrl = queueUrl;
  }

  // Método requerido para iniciar el transporte
  async listen(callback: () => void) {
    this.logger.log(`Listening for messages on queue: ${this.queueUrl}`);
    await this.pollMessages();
    callback();
  }

  // Método requerido para cerrar el transporte
  close() {
    this.logger.log('Closing SQS server...');
  }

  // Método para recibir mensajes de SQS y manejarlos
  private async pollMessages() {
    const params = {
      QueueUrl: this.queueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 20, // Long polling
    };

    try {
      const response = await this.sqs.receiveMessage(params).promise();
      if (response.Messages && response.Messages.length > 0) {
        for (const message of response.Messages) {
          const parsedMessage = JSON.parse(message.Body);

          // Procesar el mensaje usando los manejadores registrados
          this.handleMessage(parsedMessage);

          // Borrar el mensaje de la cola después de procesarlo
          await this.sqs
            .deleteMessage({
              QueueUrl: this.queueUrl,
              ReceiptHandle: message.ReceiptHandle,
            })
            .promise();
        }
      }
    } catch (error) {
      this.logger.error('Error al recibir mensajes de SQS', error);
    }

    // Continuar haciendo polling
    setTimeout(() => this.pollMessages(), 1000);
  }

  // Este método invoca los handlers registrados en el microservicio
  private handleMessage(message: any) {
    const handler = this.getHandlerByPattern(message.pattern);
    if (handler) {
      handler(message.data)
        .then((response) => {
          this.logger.log(`Mensaje procesado con éxito: ${message.pattern}`);
        })
        .catch((error) => {
          this.logger.error(`Error al procesar el mensaje: ${error.message}`);
        });
    } else {
      this.logger.warn(`No handler found for pattern: ${message.pattern}`);
    }
  }
}

*/
