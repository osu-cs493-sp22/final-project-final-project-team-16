const {ObjectId} = require ('mongodb')

const { getDbReference } = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')
const { UserSchema,addEnrolled } = require('../models/user')

const courseSchema = {
    subject: { required: true },
    number: { required: true },
    title: { required: true },
    term: { required: true },
    instructorId: { required: true }
}
exports.courseSchema = courseSchema

const enrollSchema = {
    add: { required: false},
    remove: { required: false}
}

//Returns a page of courses
async function getCoursesPage(page) {
    const db = getDbReference()
    const collection = db.collection('courses')
    const count = await collection.countDocuments()

    const pageSize = 10
    const lastPage = Math.ceil(count / pageSize)
    page = page > lastPage ? lastPage : page
    page = page < 1 ? 1 : page
    const offset = (page - 1) * pageSize

    const results = await collection.find({})
        .sort({_id: 1})
        .skip(offset)
        .limit(pageSize)
        .toArray()
    return {
        courses: results,
        page: page,
        totalPages: lastPage,
        pageSize: pageSize,
        count: count
    }
}
exports.getCoursesPage = getCoursesPage

async function insertNewCourse(course) {
    const db = getDbReference()
    const collection = db.collection('courses')
    course = extractValidFields(course, courseSchema)
    
    const result = await collection.insertOne(course)
    return result.insertedId 
}
exports.insertNewCourse = insertNewCourse

async function getCourseById(id) {
    const db = getDbReference()
    const collection = db.collection('courses')
    const results = await collection.find(
        { _id: new ObjectId(id)}
    ).toArray()
    return results[0]
}
exports.getCourseById = getCourseById

async function updateCourse(id, course) {
    const db = getDbReference()
    const collection = db.collection('courses')
    collection.update({_id: new ObjectId(id)}, { $set: course})
}
exports.updateCourse = updateCourse

async function deleteCourse(id) {
    const db = getDbReference()
    const collection = db.collection('courses')
    console.log(new ObjectId(id))
    const result = await collection.deleteOne ({
        _id: new ObjectId(id)
    })
    return result.deletedCount > 0
}
exports.deleteCourse = deleteCourse

async function getCourseAssignments(id) {
    const db = getDbReference()
    const collection = db.collection('courses')
    const results = await collection.aggregate([
    { "$addFields": { "stringId": { "$toString": "$_id" }} },
    { $lookup: {
      from: "assignments",
      localField: "stringId",
      foreignField: "courseId",
      as: "assignments"
    }}
    ]).toArray()
    return results[0]
}
exports.getCourseAssignments = getCourseAssignments

async function enrollStudents(id, enrollList) {
    var results = null
    var results2 = null
    var objectIdAdd = []
    var objectIdRemove = []
    const db = getDbReference()
    console.log(enrollList.add)
    console.log(enrollList.remove)
    const collection = db.collection('courses')
    if(enrollList.add && enrollList.add.length) {
        for(var i = 0; i < enrollList.add.length; i++) {
            objectIdAdd[i] = new ObjectId(enrollList.add[i])
            addEnrolled(enrollList.add[i],id)
        }
        results = await collection.updateOne(
            {_id: new ObjectId(id)},
            {$push: {enrolled: { $each: objectIdAdd} }}
        )
    }
    if(enrollList.remove && enrollList.remove.length) {
        for(var i = 0; i < enrollList.remove.length; i++) {
            objectIdRemove[i] = new ObjectId(enrollList.remove[i])
        }
        results2 = await collection.updateOne(
            {_id: new ObjectId(id)},
            {$pull: {enrolled: { $in: objectIdRemove}}}
        ) 
    }
    if (results && results2) {
        return (results.matchedCount || results2.matchedCount) > 0
    } else if (!results && results2) {
        return (results2.matchedCount) > 0
    } else {
        return (results.matchedCount) > 0
    }
}
exports.enrollStudents = enrollStudents

async function getStudentsFromCourse(id) {
    const db = getDbReference()
    const collection = db.collection('courses')
    const results = await collection.aggregate([
        {$match: {_id: new ObjectId(id)}},
        {$lookup: {
            from: "users",
            localField: "enrolled",
            foreignField: "_id",
            as: "students"
        }}
    ]).toArray()
    return results[0]
}
exports.getStudentsFromCourse = getStudentsFromCourse

async function bulkInsertNewCourses(courses) {

    const coursesToInsert = courses.map(function (user) {
      return extractValidFields(user, courseSchema)
    })

    const db = getDbReference()
    const collection = db.collection('courses')
    const result = await collection.insertMany(coursesToInsert)
    return result.insertedIds
}
exports.bulkInsertNewCourses = bulkInsertNewCourses