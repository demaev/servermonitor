import config from './config';
import router from './api';
import express from 'express';

const server = express();

server.set('view engine', 'ejs');
server.get('/', (req, res) => {
  res.render('index', {
    content: 'test'
  });
});

server.use('/api', router);

server.listen(config.port, () => {
    console.info('Express listening on port ', config.port);
});