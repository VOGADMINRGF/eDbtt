const { Kafka } = require('kafkajs');

const brokers = (process.env.KAFKA_BROKERS || 'localhost:19092').split(',');
const kafka = new Kafka({ brokers });
const consumer = kafka.consumer({ groupId: 'vog-local-dev' });

(async () => {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: 'vog.events', fromBeginning: true });
    console.log('Consuming from vog.events …');
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        console.log({
          topic,
          partition,
          key: message.key?.toString(),
          value: message.value?.toString(),
          ts: message.timestamp,
        });
      },
    });
  } catch (err) {
    console.error('Consumer error:', err);
    process.exit(1);
  }
})();
