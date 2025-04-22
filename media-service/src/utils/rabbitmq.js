const amqp = require("amqplib");
const logger = require("./logger");

let connection = null;
let channel = null;

const EXCHANGE_NAME = "facebook_events";

async function connectToRabbitMQ() {
  try {
    if (connection) return channel; // Avoid reconnecting if already connected

    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: false });

    logger.info("Connected to RabbitMQ");

    connection.on("close", () => {
      logger.warn("RabbitMQ connection closed, attempting to reconnect...");
      setTimeout(connectToRabbitMQ, 5000); // Retry after 5 seconds
    });

    return channel;
  } catch (e) {
    logger.error("Error connecting to RabbitMQ", e);
    throw new Error("Failed to connect to RabbitMQ");
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
async function consumeEvent(routingKey, callback) {
  if (!channel) await connectToRabbitMQ();

  try {
    const q = await channel.assertQueue("", { exclusive: true });

    await channel.bindQueue(q.queue, EXCHANGE_NAME, routingKey);

    logger.info(`Waiting for messages with routing key: ${routingKey}`);

    channel.consume(
      q.queue,
      (msg) => {
        if (msg !== null) {
          try {
            const content = JSON.parse(msg.content.toString());
            callback(content);
            channel.ack(msg);
            logger.info(`Subscribed to event: ${routingKey}`);
          } catch (err) {
            logger.error("Error parsing message content", err);
            channel.nack(msg, false, true); // Requeue the message if parsing fails
          }
        }
      },
      { noAck: false }
    );
  } catch (err) {
    logger.error("Error in consumer setup", err);
    throw new Error("Failed to consume events");
  }
}

module.exports = { connectToRabbitMQ, publishEvent, consumeEvent };
