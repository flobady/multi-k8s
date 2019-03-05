const keys = require('./keys');

// Express App setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors()); // cross origin resource sharing, react domain peut communiquer avec d'autres domain (express api domain)
app.use(bodyParser.json()); // toutes les requests qui viennent de react sont parsées en objet json

// Postgres Client Setup
const { Pool } = require('pg');
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort
});
pgClient.on('error', () => console.log("Lost PG connection")); // si on perd post gre on aura un message

pgClient
  .query('CREATE TABLE IF NOT EXISTS values (number INT)') // on doit créer au moins une table pour initialiser la database
  .catch(err => console.log(err));

// Redis Client Setup
const redis = require('redis');
const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000
});

const redisPublisher = redisClient.duplicate(); // d'apres la doc quand un client écoute ou publie des infos de redis il faut dupliquer car le redisClient ne peut pas etre utiliser pour d'autres buts si il est utilisé dans le cadre d'une écoute

// Express Route Handlers
app.get('/', (req, res) => {
  res.send('Hi');
});

app.get('/values/all', async (req, res) => { // retourne tous les index soumis dans le passé
  const values = await pgClient.query('SELECT * from values');
  res.send(values.rows);
});

app.get('/values/current', async (req, res) => { // retourne les valeurs calculées pour chaque index
  redisClient.hgetall('values', (err, values) => { // redis n'a pas le async await support donc on utilise callbacks
    res.send(values);
  });
});

app.post('/values', async (req, res) => {
  const index = req.body.index;

  if(parseInt(index) > 40) {
    return res.status(422).send('Index too high');
  }

  redisClient.hset('values', index, 'Nothing yet!'); // dans un premier temps on mets "nothing yet" puis le worker va faire le boulot
  redisPublisher.publish('insert', index); // c'est ce message qui réveille le worker process
  pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);

  res.send({ working: true });
})

app.listen(5000, () => {
  console.log("Listening to port 5000");
});
