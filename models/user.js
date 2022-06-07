const { ObjectId } = require('mongodb')
const { extractValidFields } = require('../lib/validation')
const { getDbReference } = require('../lib/mongo')

const bcrypt = require('bcryptjs');

const UserSchema = {
    name: { required: true },
    email: { required: true },
    password: { required: true },
    role: { required: true }
}

exports.UserSchema = UserSchema

exports.insertNewUser = async function (user) {
    const userToInsert = extractValidFields(user, UserSchema)
    const db = getDbReference()
    const collection = db.collection('users')
    const result = await collection.insertOne(userToInsert)
    return result.insertedId
  }

  async function bulkInsertNewUsers(users) {

    var arrayLength = users.length
    for(var i = 0; i < arrayLength; i++){
        users[i].password = await bcrypt.hash(users[i].password, 8);
    }

    const usersToInsert = users.map(function (user) {
      return extractValidFields(user, UserSchema)
    })

    const db = getDbReference()
    const collection = db.collection('users')
    const result = await collection.insertMany(usersToInsert)
    return result.insertedIds
  }
  exports.bulkInsertNewUsers = bulkInsertNewUsers