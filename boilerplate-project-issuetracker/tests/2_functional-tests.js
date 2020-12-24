const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const mongoose = require('mongoose');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  let test_id1 = ''
  let test_id2 = ''
  let test_id3 = new mongoose.Types.ObjectId()

  /* test that sends info through the form to check it's being posted correctly */
  test('Every field filled in', function(done) {
    chai.request(server)
      .post('/api/issues/test')
      .send({
        issue_title: 'Title',
        issue_text: 'text',
        created_by: 'Functional Test - Every field filled in',
        assigned_to: 'Chai and Mocha',
        status_text: 'In QA'
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);        
        assert.equal(res.body.issue_title, 'Title')
        assert.equal(res.body.issue_text, 'text')
        assert.equal(res.body.created_by, 'Functional Test - Every field filled in')
        assert.equal(res.body.assigned_to, 'Chai and Mocha')
        assert.equal(res.body.status_text, 'In QA')
        assert.equal(res.body.project, 'test')
        test_id1 = res.body._id
        console.log('id 1 has been set as ' + test_id1)
        done();        
      })
  })

  /* test that only required fields are filled in and correctly sent to database, other fields are blank */
  test('Required fields filled in', function(done) {
    chai.request(server)
      .post('/api/issues/test')
      .send({
        issue_title: 'Title',
        issue_text: 'text',
        created_by: 'Functional Test - Required fields filled in',
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.issue_title, 'Title')
        assert.equal(res.body.issue_text, 'text')
        assert.equal(res.body.created_by, 'Functional Test - Required fields filled in')
        assert.equal(res.body.assigned_to, '')
        assert.equal(res.body.status_text, '')
        assert.equal(res.body.project, 'test')
        done();
      });
  })

  /* Attempts to post with missing required fields and check that the error message is returnd */
  test('Missing required fields', function(done) {
    chai.request(server)
    .post('/api/issues/test')
    .send({
      issue_title: 'Title'
    })
    .end(function(err, res) {
      assert.equal(res.body, { error: 'required field(s) missing' })
      done()
    })
  })

  test('No body', function(done) {
    chai.request(server)
      .put('/api/issues/test')
      .send({
        _id: ''
      })
      .end(function(err, res){
        assert.equal(res.body, { error: 'missing _id' })
        done()
      });
  });

  // test for when one field is updated, a success message is sent
  test('One field to update', function(done) {
    chai.request(server)
      .put('/api/issues/test')
      .send({
        _id: test_id1,
        issue_text: 'new text'
      })
      .end(function(err, res){
        assert.equal(res.body, { result: 'successfully updated', '_id': test_id1 })
        done()
      });
  });

  // test for when multiple fields are updated, a success message is sent
  test('Multiple fields to update', function(done) {
    chai.request(server)
      .put('/api/issues/test')
      .send({
        _id: test_id2,
        issue_title: 'new title',
        issue_text: 'new text'
      })
      .end(function(err, res){
        assert.equal(res.body, { result: 'successfully updated', '_id': test_id2 })
        done()
      });
  });

  // test for trying to delete without an id provided. Ensure that the error message is returned
  test('Delete an issue with missing id', function(done) {
    chai.request(server)
    .delete('/api/issues/apitest')
    .send({ /* no id provided */
    })
    .end(function(err, res){
      assert.equal(res.status, 200)
      assert.equal(res.body.error, 'missing_id')
      done()
    });
  });

  // test for deleting an issue WTIH an id provided
  test('Delete issue with valid _id', function(done) {
    chai.request(server)
    .delete('/api/issues/apitest')
    .send({
      _id: test_id1
    })
    .end(function(err, res) {
      assert.equal(res.status, 200)
      assert.equal(res.body.result, 'successfully deleted')
      assert.equal(res.body._id, test_id1)
      done()
    });

    // chai.request(server)
    // .delete('/api/issues/test')
    // .send({
    //   _id: test_id2
    // })
    // .end(function(err, res) {
    //   assert.equal(res.status, 200)
    //   assert.equal(res.body.result, 'successfully deleted')
    //   assert.equal(res.body._id, test_id2)
    //   done()
    // });
  });

  test('Delete an issue with an invalid _id', (done) => {
    chai.request(server)
    .delete('/api/issues/apitest')
    .send({
      _id: test_id3
    })
    .end(function(err, res){
      assert.equal(res.status, 200)
      assert.equal(res.body.error, 'could not delete')
      assert.equal(res.body._id, test_id3)
      done();
    });
  })

  // test for retrieiving issues in single project
  test('No filter', function(done) {
    chai.request(server)
    .get('/api/issues/test')
    .query({}) /* no filter */
    .end(function(err, res){
      assert.equal(res.status, 200);
      assert.isArray(res.body);
      assert.property(res.body[0], 'issue_title');      
      assert.property(res.body[0], 'issue_text');
      assert.property(res.body[0], 'created_on');
      assert.property(res.body[0], 'updated_on');
      assert.property(res.body[0], 'created_by');
      assert.property(res.body[0], 'assigned_to');
      assert.property(res.body[0], 'open');
      assert.property(res.body[0], 'status_text');
      assert.property(res.body[0], '_id');
      done();
    });
  });

  // test for when one field is used as filter
  test('One filter', function(done) {
    chai.request(server)
    .get('/api/issues/test')
    .query({created_by 'Function Test - Every field filled in'})
    .end(function(err, res) {
      res.forEach((issueResult) => {
        assert.equal(issueResult).created_by === 'Functional Test - Every field filled in'
      })
      done()
    });

    chai.request(server)
    .get('/api/issues/test')
    .query({
      open:true,
      created_by: 'Functional Test - Every field filled in'
    })
    .end(function(err, res){
      res.body.forEach((issueResult) => {
        assert.equal(issueResult.open, true)
        assert.equal(issueResult.created_by, 'Functional Test - Every field filled in')
      })
      done()
    })
  });

});
