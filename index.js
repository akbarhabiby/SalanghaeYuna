const server = require('restify').createServer();
const cron = require('node-cron');
const Twit = require('twit');
const config = require('./config');

let isBotAlive = false

const T = new Twit({
  consumer_key: config.CONSUMER_KEY,
  consumer_secret: config.CONSUMER_SECRET,
  access_token: config.ACCESS_TOKEN,
  access_token_secret: config.ACCESS_TOKEN_SECRET
});

const bot = cron.schedule('* * * * *', () => {
  const { morning, night, newYear, birthDay } = config.GREETINGS
  const [ year, month, day, format, exactTime ] = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }).split(' ');
  const [ hour, minutes ] = exactTime.split(':');
  const earlyDay = format === '오전' && hour === '0' && minutes === '00';
  const yunaBirthDateAsClock = hour === '9' && minutes === '12'

  const isNewYear = month === '1.' && day === '1.' && earlyDay;
  const isYunaBirthday = month === '12.' && day === '9.' && earlyDay;
  const isMorning = format === '오전' && yunaBirthDateAsClock;
  const isNight = format === '오후' && yunaBirthDateAsClock;

  const randomize = (arr) => arr[Math.floor(Math.random() * arr.length)];

  let status = '';
  
  if (isNewYear) {
    status = `${newYear.greet} ${year} ${newYear.wish}`;
  } else if (isYunaBirthday) {
    const age = Number(year.substring(0, year.length - 1)) - 2003;
    status = `Happy ${String(age)}th Birthday ${birthDay.wish}`
  } else if (isMorning) {
    status = randomize(morning);
  } else if (isNight) {
    status = randomize(night);
  };

  if (status) {
    const tweet = new Promise((resolve, reject) => {
      T.post('statuses/update', { status: status }, (err, { id_str, text }) => {
        if (err) {
          reject(err)
        } else {
          resolve({
            message: 'Your Tweet was sent.',
            link: `https://twitter.com/akbarhabiby/status/${id_str}`,
            tweet: text,
          })
        }
      });
    });
    
    tweet
      .then(console.log)
      .catch(console.error)
      // * No need to clear status, because the status is already cleared when the cronjob start the task again.
  } else if (minutes === '00') {
    isBotAlive = true;
    console.log({
      message: 'The BOT is Running, giving status for each hour',
      time: exactTime
    });
  };
});

server.get('/', (req, res, next) => {
  res.send({
    isBotAlive,
    time: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
    repository: 'https://github.com/akbarhabiby/SalanghaeYuna',
    twitter: 'https://twitter.com/akbarhabiby'
  });
});

server.listen(config.PORT, () => {
  // * Start the Tweet Bot
  bot.start();
  console.log('Twitter BOT Started! and Server is listening at PORT ' + config.PORT);
});

