const { Kafka } = require('kafkajs');

const brokers = (process.env.KAFKA_BROKERS || 'localhost:19092').split(',');
const kafka = new Kafka({ brokers });
const producer = kafka.producer();

(async () => {
  try {
    await producer.connect();
    const payload = { ping: true, at: new Date().toISOString() };
    await producer.send({
      topic: 'vog.events',
      messages: [{ key: 'key1', value: JSON.stringify(payload) }],
    });
    console.log('Produced 1 message to vog.events:', payload);
  } catch (err) {
    console.error('Producer error:', err);
    process.exit(1);
  } finally {
    await producer.disconnect();
  }
})();
