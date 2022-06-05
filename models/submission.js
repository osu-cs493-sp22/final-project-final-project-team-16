const { ObjectId, GridFSBucket } = require('mongodb')
const fs = require('fs')
const { getDbReference } = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')

/*
 * Schema describing required/optional fields of a submissions object.
 */
const SubmissionsSchema = {
    assignmentId: {required: true},
    studentId: {required: true},
    timestamp: {required: true},
    grade: {required: true}
}
exports.SubmissionsSchema = SubmissionsSchema


/*
 * Executes a DB query to insert a new photo into the database.  Returns
 * a Promise that resolves to the ID of the newly-created photo entry.
 */
async function insertNewPhoto(photo) {
  photo = extractValidFields(photo, PhotoSchema)
  photo.businessId = ObjectId(photo.businessId)
  const db = getDbReference()
  const collection = db.collection('photos')
  const result = await collection.insertOne(photo)
  return result.insertedId
}
exports.insertNewPhoto = insertNewPhoto

/*
 * Executes a DB query to fetch a single specified photo based on its ID.
 * Returns a Promise that resolves to an object containing the requested
 * photo.  If no photo with the specified ID exists, the returned Promise
 * will resolve to null.
 */
async function getSubmissionById(id) {
  const db = getDbReference()
  //const collection = db.collection('submissions')
  const bucket = new GridFSBucket(db, {bucketName: 'submissions'})
  if (!ObjectId.isValid(id)) {
    return null
  } else {
    const results = await bucket
      .find({ _id: new ObjectId(id) })
      .toArray()
    return results[0]
  }
}
exports.getSubmissionById = getSubmissionById

async function saveFileInfo(photo){
  const db = getDbReference()
  const collection = db.collection('photos')
  const result = await collection.insertOne(photo)
  return result.insertedId
}
exports.saveFileInfo = saveFileInfo

async function saveSubmissionFile (submission){
  return new Promise(function(resolve, reject){
    const db = getDbReference()
    const bucket = new GridFSBucket(db, {bucketName: 'submissions'})
    const metadata = {
      assignmentId: submission.assignmentId,
      studentId: submission.studentId,
      timestamp: submission.timestamp,
      grade: submission.grade,
      file: `/media/uploads/${submission.filename}`,
      mimetype: submission.mimetype
    }
    const uploadStream = bucket.openUploadStream(submission.filename, {
      metadata: metadata
    })
    fs.createReadStream(submission.path).pipe(uploadStream)
      .on('error', function (err){
        reject(err)
      })
      .on('finish', function(result){
        console.log("===stream result:", result)
        resolve(result._id)
      })
  })
}
exports.saveSubmissionFile = saveSubmissionFile

function getImageDownloadStream (filename){
  const db = getDbReference()
  const bucket = new GridFSBucket(db, {bucketName: 'submissions'})
  return bucket.openDownloadStreamByName(filename)
}
exports.getImageDownloadStream = getImageDownloadStream