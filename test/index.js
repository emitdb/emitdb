var emitdb = require('../'),
  rimraf = require('rimraf'),
  assert = require('assert');

//
// prepare a test database
//
var db = emitdb('testdb', function ready(err, dbins) {
  //
  // required properties, no errors
  //
  assert.ok(!err);
  assert.equal(dbins.db_name, 'testdb');
  assert.ok(dbins.dotfile.dirname);
  assert.ok(dbins.db.location);
  assert.ok(Array.isArray(dbins.indexes));
  //
  // put a simple file
  //
  db.put('/foo', {
    foo: 1
  }, function (err) {
    assert.ok(!err);
    //
    // get the same file
    //
    db.get('/foo', function (err, doc) {
      assert.ok(!err);
      //
      // test equality
      //
      assert.deepEqual(doc, {
        foo: 1
      });
      //
      // delete the file
      //
      db.del('/foo', function (err) {
        assert.ok(!err);
        //
        // can't get file, cause it was deleted
        //
        db.get('/foo', function (err) {
          assert.ok(err);
          assert.equal(err.name, 'NotFoundError');
          //
          // destroy the database from disk
          //
          rimraf(dbins.db.location, function (err) {
            assert.equal(err, null);
          });
        });
      });
    });
  });
});

console.log('nothing blew up? awsm, must be working then!');
