'use strict';

let mongodb = require('mongodb')
let mongoose = require('mongoose')
const db_pw = process.env.MONGDB_PW
let db_name = 'FCC_issue_tracker'
let uri = 'mongodb+srv://pbarrow-user1:' + db_pw + '@cluster0.ryd2n.mongodb.net/' + db_name + '?retryWrites=true&w=majority'

module.exports = function (app) {

  // connect to the database
  mongoose.connect(uri, { 
    useNewUrlParser: true, useUnifiedTopology: true
  })

  // Create issue Schema
  let issueSchema = new mongoose.Schema({
    issue_title: {type: String, required: true},
    issue_text: {type: String, required: true},
    created_by: {type: String, required: true},
    assigned_to: String, 
    status_text: String,
    open: {type: Boolean, required: true},
    created_on: {type: Date, required: true},
    updated_on: {type: Date, required: true},
    project: String
  })

  // create a model for each issue using the schema above
  let Issue = mongoose.model('Issue', issueSchema)

  app.route('/api/issues/:project')

    // GET /api/issue/project for an arry of all issues in that project. Uses Issue.find
    .get(function (req, res){
      let project = req.params.project;
      /* create filter object from request query */
      let filterObject = Object.assign(req.query)
      /* set projects field from the filterObject */
      filterObject['project'] = req.params.project
      Issue.find(
        /* use filterObject as the filter object */
        filterObject,
        (err, issues) => {
          if(!err && issues) {
            res.json(issues)
          }
        }
      )

    })
    
    // create a new Issue instance with data from form body
    .post(function (req, res){
      /* project equal to project in req params */
      let project = req.params.project;
      let newIssue = new Issue({
        /* you can see the field names in index.html */
        issue_title: req.body.issue_title,
        issue_text: req.body.issue_text,
        created_by: req.body.created_by,
        assigned_to: req.body.assigned_to || '',
        status_text: req.body.status_text || '',
        /* new issues are open by defaul */
        open: true,
        created_on: new Date().toUTCString(),
        updated_on: new Date().toUTCString(),
        project: project
      })
      newIssue.save((err, savedIssue) => {
        if(!err && savedIssue) {
          res.json(savedIssue)
        }
      })

      /* check that required fields aren't missing */
      if(!req.body.issue_title || !req.body.issue_text || !req.body.created_by){
        res.json({ error: 'required field(s) missing' })
      }
      
    })
    
    .put(function (req, res){
      let project = req.params.project;
      /* return an error message if no fields are filled in (Need id field and one other field) */
      if(Object.keys(req.body).length < 2){
        return res.json({ error: 'no update field(s) sent', '_id': req.body['_id]'] })
      }

      /* update the issue with value from form */
      let updateObject = {}
      Object.keys(req.body).forEach((key) => {
        if(req.body[key] != ''){
          updateObject[key] = req.body[key]
        }
      })
      console.log(updateObject)

      /* return error message if nothing was updated */
      if(Object.keys(updateObject).length < 2) {
        return res.json({ error: 'no update field(s) sent', '_id': updateObject['_id'] })
      }

      /* auto update updated_on with current date */
      updateObject['updated_on'] = new Date().toUTCString()

      /* findByIdAndUpdate a given issue, basically replacing it with the 'updateObject' */
      Issue.findByIdAndUpdate(
        req.body._id,
        updateObject,
        {new: true},
        (err, updatedIssue) => {
          if(!err && updatedIssue){
            console.log("Here")
            return res.json({ result: 'successfully updated', '_id': req.body._id })
          } else if(!updatedIssue){
            return res.json('could not update ' + req.body._id)
          }
        }
      )
    })
    
    // DELETE route; can delete an issue with an id. Uses findByIdAndRemove
    .delete(async (req, res) => {
      let project = req.params.project;
      let id_del = req.body._id
      /* if no id, send back error */
      if(!id_del) {
        res.json({ error: 'missing _id' })
      }
      let issue = await Issue.findOne({_id: id_del}).exec();
      if(!issue){
        res.json({error: 'could not delete', _id: id_del})
      } else {
        Issue.findByIdAndRemove({id_del});
        res.status(200).json({result: 'successfully deleted', _id: id_del})
      }
      
    });
    
};
