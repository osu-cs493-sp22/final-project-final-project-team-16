const { MongoClient } = require('mongodb')


const mongoHost = process.env.MONGO_HOST
const mongoPort = process.env.MONGO_PORT || 27017
const mongoUser = process.env.MONGO_USER
const mongoPassword = process.env.MONGO_PASSWORD
const mongoDbName = process.env.MONGO_DB_NAME
const mongoURL = `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:${mongoPort}/${mongoDbName}?authSource=admin`


let db = null
let _closeDbConnection = null
exports.connectToDb = function (callback){
    console.log("MONGO_URL: " + mongoURL)
    MongoClient.connect(mongoURL, function(err, client){

        if(err){
            throw err
        }
        db = client.db(mongoDbName)
        _closeDbConnection = function () {
            client.close()
        }
        callback()
    })
}

exports.getDbReference = function(){
    return db
}

exports.closeDbConnection = function (callback) {
    _closeDbConnection(callback)
  }
