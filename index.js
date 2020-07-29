const redis = require('redis');
const { promisify } = require("util");
const { isError, getMessage } = require('./utils');
const client = redis.createClient();

// async functions
const lrangeAsync = promisify(client.lrange).bind(client);
const delAsync = promisify(client.del).bind(client);
const clientAsync = promisify(client.client).bind(client);
const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);
const lpushAsync = promisify(client.lpush).bind(client);
const rpopAsync = promisify(client.rpop).bind(client);

// queues
const QUEUE = 'messages_queue';
const INCORRECT = 'incorrects';


async function start() {
  process.argv.includes('getErrors') ? getErrors() : standard();
} 

start();


async function getErrors() {
  const errors = await lrangeAsync(INCORRECT, 0, -1);
  console.log(errors);
  await delAsync(INCORRECT);
  console.log('DELETE SUCCESS');
  process.exit(0);
}

async function standard() {
  let id = await clientAsync('id');
  let exitMode = receiverMode();

  client.on('error', (err) => {
    console.error('Error: ', err);
  });

  // check generator is working
  setInterval(async () => {
    const list = await clientAsync('list');
    const clientIds = list.split('\n').filter(Boolean).map((item) => item.split(' ')[0].substring(3));
    const generatorId = await getAsync('generatorId');
    if (!generatorId || !clientIds.includes(generatorId)) {
      await setAsync('generatorId', id);
      exitMode();
      exitMode = generatorMode();
      return;
    }
  }, 1);
}

function receiverMode() {
  const receiver = setInterval(async () => {
    const msg = await rpopAsync(QUEUE);
    if (!msg) return;
    console.log('Message: ', msg);
    if (isError()) {
      await lpushAsync(INCORRECT, msg);
    }
  }, 0);

  return () => clearInterval(receiver);
}

function generatorMode() {
  const generator = setInterval(() => {
    lpushAsync(QUEUE, getMessage());
  }, 1000);

  return () => clearInterval(generator);
}
