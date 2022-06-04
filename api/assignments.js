
const bcrypt = require('bcryptjs')
const router = require('express').Router()
exports.router = router;

const { validateAgainstSchema, extractValidFields } = require('../lib/validation')
const { AssignmentSchema, insertNewAssignment, getAssignmentById, modifyAssignmentById, deleteAssignment } = require('../models/assignment')
const { requireAuthentication } = require('../lib/auth')


router.get('/:assignmentid', async function (req, res, next) { // Fetch Data about a specific Assignment
    try{
        const assignmentid = req.params.assignmentid
        const assignment = await getAssignmentById(assignmentid)
        res.status(200).json(assignment);
      }catch(err){
        next()
      }
})

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
        const assignmentid = req.params.assignmentid
        const assignment = await getAssignmentById(assignmentid)
        res.status(200).json(assignment);
    }catch(err){
    next()
    }
})

router.patch('/:id', async function (req, res, next) { // Update data for a specific Assignment
    try{
        const assignmentid = req.body.assignmentid
        const updateAssignment = req.body;
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

router.delete('/', async function (req, res) { // Remove a specific Assignent from the database
    try{
        const assignmentid = req.body.assignmentid
        await deleteAssignment(assignmentid)
      }catch(err){
        next()
      }
      res.status(204).end();
})

// router.get('/:id/submissions', async function (req, res, next) { // Fetch the list of all Submissions for an Assignment

// })

// router.post('/:id/submissions', async function (req, res) { // Create a new Submission for an Assignment (student)
    
// })
