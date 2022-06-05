
const bcrypt = require('bcryptjs')
const fs = require('fs/promises')

const router = require('express').Router()
exports.router = router;

const { validateAgainstSchema, extractValidFields } = require('../lib/validation')
const { AssignmentSchema, insertNewAssignment, getAssignmentById, modifyAssignmentById, deleteAssignment, getAssignmentSubmissions } = require('../models/assignment')
const { SubmissionsSchema, saveSubmissionFile } = require('../models/submission')
const { requireAuthentication } = require('../lib/auth')

router.post('/', async function (req, res, next) { // Create a new Assignment
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

router.get('/:id', async function (req, res, next) { // Fetch data about a specific Assignment
    try{
        console.log("GETTING ASSIGNMENTS")
        const assignmentid = req.params.id
        const assignment = await getAssignmentById(assignmentid)
        res.status(200).json(assignment)
    }catch(err){
        next()
    }
})

router.patch('/:id',  async function (req, res, next) { // Update data for a specific Assignment
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

router.delete('/:id',  async function (req, res, next) { // Remove a specific Assignent from the database
    try{
        const assignmentid = req.params.id
        await deleteAssignment(assignmentid)
    }catch(err){
        next()
    }
    res.status(204).end();
})

router.get('/:id/submissions',  async function (req, res, next) { // Fetch the list of all Submissions for an Assignment
    try{
        const assignmentid = req.params.id
        const submissions = await getAssignmentSubmissions(assignmentid)
        res.status(200).json(submissions);
    }catch(err){
        next()
    }
})

router.post('/:id/submissions', async function (req, res) { // Create a new Submission for an Assignment (student)
    console.log("==req.file:", req.file)
    console.log("==req.body:", req.body)
    if(req.file && validateAgainstSchema(req.body, SubmissionsSchema)){
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
