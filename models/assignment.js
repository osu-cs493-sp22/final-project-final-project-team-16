const { ObjectId, GridFSBucket } = require('mongodb')
//const bcrypt = require ('bycryptjs')
const { extractValidFields } = require('../lib/validation')
const { getDbReference } = require('../lib/mongo')

const AssignmentSchema = {
    courseId: { required: true },
    title: { required: true },
    points: { required: true },
    dueDate: { required: true }
}

exports.AssignmentSchema = AssignmentSchema


/*
  * Insert a new Assignment.
  */
exports.insertNewAssignment = async function (assignment) {
    const assignmentToInsert = extractValidFields(assignment, AssignmentSchema)
    const db = getDbReference()
    const collection = db.collection('assignments')
    const result = await collection.insertOne(assignmentToInsert)
    return result.insertedId
  }
  
  
  /*
  * Fetch an Assignment from the DB based on Assignment ID.
  */
exports.getAssignmentById = async function (id) {
  const db = getDbReference()
  const collection = db.collection('assignments')
  if (!ObjectId.isValid(id)) {
    return null
  } else {
    const results = await collection
    .find({ _id: new ObjectId(id) })
    .toArray()
    return results[0]
  }
}

exports.modifyAssignmentById = async function (id, updateAssignment){
  const db = getDbReference()
  const collection = db.collection('assignments')
  collection.update({_id: new ObjectId(id)}, { $set: updateAssignment})
}

exports.deleteAssignment = async function (id){
  const db = getDbReference()
  const collection = db.collection('assignments')
  collection.deleteOne({_id: new ObjectId(id)})
}

exports.getAssignmentSubmissions = async function(page, id){
  /*
  const db = getDbReference()
  const bucket = new GridFSBucket(db, {bucketName: 'submissions'})
  const results =  await bucket.find({ "metadata.assignmentId": id })
    .toArray()
  return results
*/
  
  const db = getDbReference()
  const bucket = new GridFSBucket(db, {bucketName: 'submissions'})
  const assignments = await bucket.find({ "metadata.assignmentId": id })
  .toArray()

  const count = assignments.length
  console.log("count: ",count)
  

  const pageSize = 1
  const lastPage = Math.ceil(count / pageSize)
  page = page > lastPage ? lastPage : page
  page = page < 1 ? 1 : page
  const offset = (page - 1) * pageSize

  const results = await bucket.find({ "metadata.assignmentId": id })
    .sort({ _id: 1 })
    .skip(offset)
    .limit(pageSize)
    .toArray()

  return {
    submissions: results,
    page: page,
    totalPages: lastPage,
    pageSize: pageSize,
    count: count
  }
}
