require("dotenv").config();
const { consumer } = require("../../config/kafka");
const logger = require("../../config/logger");
const { TOPICS } = require("../../utils/constants");
const emailService = require("../../services/email.service");

class EmailConsumer {
  async start() {
    try {
      await consumer.connect();
      logger.info("Email Consumer connected to kafka");
      await consumer.subscribe({
        topics: Object.values(TOPICS),
        fromBeginning: true,
      });

      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const value = JSON.parse(message.value.toString());
            logger.info(`Processing message from topic: ${topic}`, {
              partition,
              offset: message.offset,
              key: message.key?.toString(),
            });
            await this.handleMessage(topic, value);
          } catch (error) {
            logger.info("Error processing message", {
              topic,
              partition,
              offset: message.offset,
              error: error.message,
              stack: error.stack,
            });
          }
        },
      });
    } catch (error) {
      logger.error("Failed to start email consumer", { error: error.message });
      throw error;
    }
  }
  async handleMessage(topic, data) {
    switch (topic) {
      case TOPICS.OTP_EMAIL:
        await this.handleOtpEmail(data);
        break;

      case TOPICS.WELCOME_EMAIL:
        await this.handleWelcomeEmail(data);
        break;

      default:
        logger.warn(`Unknown topic ${topic}`);
    }
  }
  async handleOtpEmail(data) {
    const { email, otp, ttlMinutes } = data;
    if (!email || !otp) {
      throw new Error("Missing required fields: email or otp");
    }
    await emailService.sendOTPEmail(email, otp, ttlMinutes || 5);
  }
  async handleWelcomeEmail(data) {
    const { email, firstName } = data;

    if (!email || !firstName) {
      throw new Error("Missing required fields: email or firstName");
    }

    await emailService.sendWelcomeEmail(email, firstName);
    logger.info(`Welcome email sent to ${email}`);
  }
}

module.exports = new EmailConsumer();
