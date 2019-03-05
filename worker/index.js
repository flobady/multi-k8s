// but du worker: il surveille redis, dés qu'on a un nouvel insert dans redis, le worker calcule puis store dans redis le fibonnacci
const keys = require('./keys');
const redis = require('redis');

const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000// si redisClient perd la connection au serveur, il faut essayer de se reconnecter toute les seconde
});

const sub = redisClient.duplicate(); //sub = subscription

function fib(index) {
  if(index < 2) return 1;
  return fib(index-1) + fib(index-2);
};

sub.on('message', (channel, message) => { // dés qu'on a une nouvelle value , on store dans redis la clef message (index) et on store son résulta
  redisClient.hset('values', message, fib(parseInt(message)));
});
sub.subscribe('insert');  // dés qu'on insert une nouvelle value dans redis on a le worker qui tourne qui va le calculer puis storer

