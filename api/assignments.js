
const bcrypt = require('bcryptjs')
const fs = require('fs/promises')
const crypto = require('crypto')
const multer = require('multer')
const router = require('express').Router()
exports.router = router;

const { validateAgainstSchema, extractValidFields } = require('../lib/validation')
const { AssignmentSchema, insertNewAssignment, getAssignmentById, modifyAssignmentById, deleteAssignment, getAssignmentSubmissions } = require('../models/assignment')
const { SubmissionsSchema, saveSubmissionFile } = require('../models/submission')
const { requireAuthentication } = require('../lib/auth')
const { getDbReference } = require('../lib/mongo')
const { ObjectId } = require('mongodb')

const fileTypes = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/png': 'png'
  }
  
  const upload = multer({
    storage: multer.diskStorage({
      destination: `${__dirname}/uploads`,
      filename: function(req,file,callback){
        const ext = fileTypes[file.mimetype]
        const filename = crypto.pseudoRandomBytes(16).toString('hex')
        callback(null,`${filename}.${ext}`)
      }
    }),
    fileFilter: function(req,file,callback){
      callback(null,!!fileTypes[file.mimetype])
    }
  })

router.post('/', requireAuthentication, async function (req, res, next) { // Create a new Assignment
    if (validateAgainstSchema(req.body, AssignmentSchema)) {
        try{
            const assignment = extractValidFields(req.body, AssignmentSchema);
            const id = await insertNewAssignment(assignment)
            res.status(201).json({
                id: id, 
                links: {
                    assignment: `/assignments/${id}`
                }
            });
        }catch(err){
            next()
        }
    } else {
        res.status(400).json({
            error: "Request body is not a valid assignment object"
        });
    }
})

router.get('/:id',  async function (req, res, next) { // Fetch data about a specific Assignment
    try{
        const assignmentid = req.params.id
        const assignment = await getAssignmentById(assignmentid)
        if(assignment){
            res.status(200).json(assignment)
        }else{
            next()
        }
    }catch(err){
        next()
    }
})

router.patch('/:id', requireAuthentication,  async function (req, res, next) { // Update data for a specific Assignment
    try{
        const assignmentid = req.params.id
        const updateAssignment = req.body
        await modifyAssignmentById(assignmentid, updateAssignment)
        res.status(200).json({
            links: {
                assignment: `/assignments/${assignmentid}`
            }
        });
    }catch(err){
        next()
    }
})

router.delete('/:id', requireAuthentication,  async function (req, res, next) { // Remove a specific Assignent from the database
    try{
        const assignmentid = req.params.id
        await deleteAssignment(assignmentid)
    }catch(err){
        next()
    }
    res.status(204).end();
})

router.get('/:id/submissions', requireAuthentication,  async function (req, res, next) { // Fetch the list of all Submissions for an Assignment
    try{
        const assignmentid = req.params.id
        const submissions = await getAssignmentSubmissions(assignmentid)
        res.status(200).send({
            submissions: submissions
        });
    }catch(err){
        next()
    }
})

router.post('/:id/submissions', requireAuthentication, upload.single('file'),async function (req, res, next) { // Create a new Submission for an Assignment (student)
    console.log("==req.file:", req.file)
    console.log("==req.body:", req.body)
    if(req.file && validateAgainstSchema(req.body, SubmissionsSchema)){
        const db = getDbReference()
        const user_id = req.body.studentId
        const users_collection = db.collection('users')
        const results = await users_collection
            .find({ _id: new ObjectId(user_id) })
            .toArray()
        const assignmentscollection = db.collection('assignments')
        const assignment_id = req.body.assignmentId
        const results2 = await assignmentscollection
            .find({ _id: new ObjectId(assignment_id) })
            .toArray()
        console.log("req.admin: ",req.admin)
        //if the user isn't registered or is not an authorized student or assignement doesn't exist or someone else' token
        if (results[0] == undefined || req.admin !== "student" || results2[0] == undefined || req.user !== req.body.studentId){
            try{
                if(results[0] == undefined){console.log("Student specified by studentId is not yet registered")}
            }catch(err){
                console.log("Error: Student specified by studentId is not yet registered")
            }
            if(req.admin !== "student"){console.log("Token says you aren't a student")} 
            if(results2[0] == undefined){console.log("Assignment doesn't exist")}
            if(req.user !== req.body.studentId){console.log("Can't use someone else' token")}
            res.status(400).json({
                error: "user cannot submit assignment"
            });
        }
        try{
        const submission = {
          assignmentId: req.body.assignmentId,
          studentId: req.body.studentId,
          timestamp: req.body.timestamp,
          grade: req.body.grade,
          path: req.file.path,
          filename: req.file.filename,
          mimetype: req.file.mimetype
        }
        //const id = await saveFileInfo(photo)
        const id = await saveSubmissionFile(submission)
        await fs.unlink(req.file.path)
  
        res.status(200).send({id: id})
      }catch(err){
        next(err)
      }
    }else{
      res.status(400).send({
        err: 'Request body needs an "image"'
      })
    }
})
