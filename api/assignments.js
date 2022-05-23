
const bcrypt = require('bcryptjs')
const router = require('express').Router()

exports.router = router;

const { validateAgainstSchema } = require('../lib/validation')
const { AssignmentSchema, insertNewAssignment, getAssignmentById } = require('../models/assignment')
const { requireAuthentication } = require('../lib/auth')


router.get('/:id', requireAuthentication, async function (req, res, next) { // Fetch Data about a specific Assignment

})

router.get('/:id/submissions', requireAuthentication, async function (req, res, next) { // Fetch the list of all Submissions for an Assignment

})

router.post('/', requireAuthentication, async function (req, res) { // Create a new Assignment
    
})

router.post('/:id/submissions', async function (req, res) { // Create a new Submission for an Assignment (student)
    
})

router.patch('/:id', requireAuthentication, async function (req, res) { // Update data for a specific Assignment
    
})

router.delete('/', requireAuthentication, async function (req, res) { // Remove a specific Assignent from the database
    
})