const { ObjectId } = require('mongodb')
//const bcrypt = require ('bycryptjs')
const { extractValidFields } = require('../lib/validation')
const { getDBReference } = require('../lib/mongo')

const AssignmentSchema = {
    assignment_id: { required: true },
    course_id: { required: true },
    title: { required: true },
    points: { required: true },
    due_date: { required: true },
    submission_list: { required: true }
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