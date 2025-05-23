const amqp = require("amqplib");
const logger = require("./logger");

let connection = null;
let channel = null;

const EXCHANGE_NAME = "facebook_events";
async function connectToRabbitMQ() {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, "topic", {
      durable: false,
    });

    logger.info("Connected My Rabbitmq");
    return channel;
  } catch (e) {
    logger.error("Error connecting to rabbitmq", e);
  }
}
async function publishEvent(routingKey, message) {
  if (!channel) await connectToRabbitMQ();
  channel.publish(
    EXCHANGE_NAME,
    routingKey,
    Buffer.from(JSON.stringify(message))
  );
  logger.info(`Event Published: ${routingKey}`);
}
module.exports = { connectToRabbitMQ, publishEvent };
