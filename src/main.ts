import { NestFactory } from '@nestjs/core';
import { SqsTransportModule } from './sqs-transport.module';

async function bootstrap() {
  const app = await NestFactory.create(SqsTransportModule);
  await app.listen(3000);
}
bootstrap();
