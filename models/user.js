const { ObjectId } = require('mongodb')
const { extractValidFields } = require('../lib/validation')
const { getDbReference } = require('../lib/mongo')

const bcrypt = require('bcryptjs');

const UserSchema = {
    name: { required: true },
    email: { required: true },
    password: { required: true },
    role: { required: true }, 
    enrolled : { required: false }
}

exports.UserSchema = UserSchema

exports.insertNewUser = async function (user) {
    const userToInsert = extractValidFields(user, UserSchema)
    const db = getDbReference()
    const collection = db.collection('users')
    const result = await collection.insertOne(userToInsert)
    return result.insertedId
  }

  exports.addEnrolled = async function (id, course_id) {
    const db = getDbReference()
    const collection = db.collection('users')
    const result = await collection
    .find({ _id: new ObjectId(id) })
    .toArray()
    const user = result[0]
    if (result[0].enrolled == null){
      result[0].enrolled = []
    }
    result[0].enrolled.push(course_id)
    collection.update({_id: new ObjectId(id)}, { $set: result[0]})
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