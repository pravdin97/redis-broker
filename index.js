const redis = require('redis');
const { promisify } = require("util");
const { isError, getMessage } = require('./utils');
const client = redis.createClient();
const lrangeAsync = promisify(client.lrange).bind(client);
const delAsync = promisify(client.del).bind(client);

const QUEUE = 'messages_queue';
const INCORRECT = 'incorrects';

if (process.argv.includes('getErrors')) {
  lrangeAsync(INCORRECT, 0, -1)
    .then((res) => {
      console.log(res);
      delAsync(INCORRECT)
        .then((res) => {
          console.log('DELETE SUCCESS');
          process.exit(0)
        })
    });
} else {
  let id;
  let exitMode = receiverMode();
  client.client('id', (err, res) => id = res);

  client.on('error', (err) => {
    console.error('Error: ', err);
  });


  setInterval(() => client.client('list', (err, msg) => {
    const clientIds = msg.split('\n').filter(Boolean).map((item) => item.split(' ')[0].substring(3));
    client.get('generatorId', (err, res) => {
      if (!res || !clientIds.includes(res)) {
        client.set('generatorId', id);
        exitMode();
        exitMode = generatorMode();
        return;
      }
    });
  }), 1);
  
}

function receiverMode() {
  const receiver = setInterval(() => {
    client.rpop(QUEUE, (err, msg) => {
      if (!msg) return;
      console.log('Message: ', msg);
      if (isError()) {
        client.lpush(INCORRECT, msg);
      }
    });
  }, 0);

  return () => clearInterval(receiver);
}

function generatorMode() {
  const generator = setInterval(() => {
    client.lpush(QUEUE, getMessage());
  }, 1000);

  return () => clearInterval(generator);
}