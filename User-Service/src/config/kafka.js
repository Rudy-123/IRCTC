const { Kafka, logLevel } = require("kafkajs");
const logger = require("./logger");
const config = require(".");
const kafka = new Kafka({
  clientId: config.KAFKA_CLIENT_ID,
  brokers: [config.KAFKA_BROKER || "localhost:9093"], //single broker
  logLevel: logLevel.ERROR,
  retry: {
    initialRetryTime: 300,
    retries: 8,
    maxRetryTime: 30000,
  },
});

const producer = kafka.producer({
  allowAutoTopicCreation: true,
  transactionTimeout: 30000,
  idempotent: true, //ensures exactly once-delivery so that duplicate messages are not stored in kafka
  maxInFlightRequests: 5, //at a time producer can send max 5 req to broker without waiting for resposne so 6th req sent when 1st would be completed
  retry: {
    retries: 5, //max retries 5 if the broker is not available
  },
});

let isConnected = false;
const connectProducer = async () => {
  if (!isConnected) {
    await producer.connect();
    isConnected = true;
    logger.info("Kafka Producer Connected");
  }
};

const disconnectProducer = async () => {
  if (isConnected) {
    await producer.disconnect();
    isConnected = false;
    logger.info("Kafka Producer Disconnected");
  }
};
process.on("SIGTERM", disconnectProducer);
process.on("SIGINT", disconnectProducer);
module.exports = { kafka, producer, connectProducer, disconnectProducer };
