const { ObjectId } = require('mongodb')
const { extractValidFields } = require('../lib/validation')
const { getDbReference } = require('../lib/mongo')

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

