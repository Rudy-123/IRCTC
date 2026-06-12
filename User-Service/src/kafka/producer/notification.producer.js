const { producer, connectProducer } = require("../../config/kafka");
const logger = require("../../config/logger");
const { KAFKA_TOPICS } = require("../../../../shared/constants/kafka-topics");

class NotificationProducer {
  constructor() {
    this.isInitialized = false; //for the singleton behaviour as there should be only 1 single connection btwn the producer and kafka broker
  }
  async initialize() {
    if (!this.isInitialized) {
      await connectProducer(); //connect to the producer
      this.isInitialized = true;
    }
  }
  async sendMessage(topic, key, value) {
    try {
      await this.initialize();
      const message = {
        topic,
        messages: [
          {
            key: key || `${topic}-${Date.now()}`,
            value: JSON.stringify(value),
            timeStamp: Date.now().toString(),
          },
        ],
      };
      const result = await producer.send(message);
      logger.info(`Message sent to kafka topic: ${topic}`, {
        key,
        partition: result[0].partition,
        offset: result[0].offset,
      });
      return result;
    } catch (error) {
      logger.error(`Failed to send message to kafka topic: ${topic}`, {
        error: error.message,
        stack: error.stack,
        key,
      });
      throw error;
    }
  }
  async sendOTPEmail(email, otp, ttlMinutes = 5) {
    return this.sendMessage(
      KAFKA_TOPICS.OTP_EMAIL, //it would tell us that this particular message is regarding wwhich topic we hv 2 topics 1st is the otp mail and 2nd is the welcome mail
      `otp-${email}`,
      { email, otp, ttlMinutes },
    );
  }
  async sendWelcomeEmail(email, firstName) {
    return this.sendMessage(KAFKA_TOPICS.WELCOME_EMAIL, `welcome-${email}`, {
      email,
      firstName,
    });
  }
}

module.exports = new NotificationProducer();
