const express = require('express');
const morgan = require('morgan');

const api = require('./api');
const { connectToDb } = require('./lib/mongo')
const { getImageDownloadStream } = require('./models/submission')

const redis = require('redis');
const { checkAuthentication } = require('./lib/auth');

const redisHost = process.env.REDIS_HOST || 'redis-server'
const redisPort = process.env.REDIS_PORT || 6379

const app = express();
const port = process.env.PORT || 8000;

/*
 * Morgan is a popular logger.
 */
app.use(morgan('dev'));

app.use(express.json());
app.use(express.static('public'));

const redisClient = redis.createClient({url: `redis://${redisHost}:${redisPort}`})

const rateLimitNoAuth = 10
const rateLimitAuth = 30
const rateLimitWindowMs = 60000

async function rateLimit(req, res ,next) {
  if(checkAuthentication(req, res, next)) {
    console.log("NOT USING IP")
    const user = req.user
    let tokenBucket
    try {
      tokenBucket = await redisClient.hGetAll(user)
    } catch (e) {
      next()
      return
    }
    console.log("== tokenBucket:", tokenBucket)
    tokenBucket = {
      tokens: parseFloat(tokenBucket.tokens) || rateLimitAuth,
      last: parseInt(tokenBucket.last) || Date.now()
    }
    console.log("== tokenBucket:", tokenBucket)

    const now = Date.now()
    const ellapsedMs = now - tokenBucket.last
    tokenBucket.tokens += ellapsedMs * (rateLimitAuth / rateLimitWindowMs)
    tokenBucket.tokens = Math.min(rateLimitAuth, tokenBucket.tokens)
    tokenBucket.last = now

    if (tokenBucket.tokens >= 1) {
      tokenBucket.tokens -= 1
      await redisClient.hSet(user, [['tokens', tokenBucket.tokens], ['last', tokenBucket.last]])
      // await redisClient.hSet(ip)
      next()
    } else {
      await redisClient.hSet(user, [['tokens', tokenBucket.tokens], ['last', tokenBucket.last]])
      // await redisClient.hSet(ip)
      res.status(429).send({
        err: "Too many requests per minute"
      })
    }
  } else {
    const ip = req.ip
    let tokenBucket
    try {
      tokenBucket = await redisClient.hGetAll(ip)
    } catch (e) {
      next()
      return
    }
    console.log("== tokenBucket:", tokenBucket)
    tokenBucket = {
      tokens: parseFloat(tokenBucket.tokens) || rateLimitNoAuth,
      last: parseInt(tokenBucket.last) || Date.now()
    }
    console.log("== tokenBucket:", tokenBucket)

    const now = Date.now()
    const ellapsedMs = now - tokenBucket.last
    tokenBucket.tokens += ellapsedMs * (rateLimitNoAuth / rateLimitWindowMs)
    tokenBucket.tokens = Math.min(rateLimitNoAuth, tokenBucket.tokens)
    tokenBucket.last = now

    if (tokenBucket.tokens >= 1) {
      tokenBucket.tokens -= 1
      await redisClient.hSet(ip, [['tokens', tokenBucket.tokens], ['last', tokenBucket.last]])
      // await redisClient.hSet(ip)
      next()
    } else {
      await redisClient.hSet(ip, [['tokens', tokenBucket.tokens], ['last', tokenBucket.last]])
      // await redisClient.hSet(ip)
      res.status(429).send({
        err: "Too many requests per minute"
      })
    }
  }
}
app.use(rateLimit)

/*
 * All routes for the API are written in modules in the api/ directory.  The
 * top-level router lives in api/index.js.  That's what we include here, and
 * it provides all of the routes.
 */
app.use('/', api);

app.get('/media/uploads/:filename', function(req,res,next){
  getImageDownloadStream(req.params.filename)
    .on('file', function(file){
      res.status(200).type(file.metadata.mimetype)
    })
    .on('error', function(err){
      if(err.code === 'ENOENT'){
        next()
      }else{
        next(err)
      }
    })
    .pipe(res)
})

app.use('*', function (req, res, next) {
  res.status(404).json({
    error: "Requested resource " + req.originalUrl + " does not exist"
  });
});

/*
 * This route will catch any errors thrown from our API endpoints and return
 * a response with a 500 status to the client.
 */
app.use('*', function (err, req, res, next) {
  console.error("== Error:", err)
  res.status(500).send({
      err: "Server error.  Please try again later."
  })
})

redisClient.connect().then(connectToDb(function () {
  app.listen(port, function() {
    console.log("== Server is running on port", port);
  });
}))

