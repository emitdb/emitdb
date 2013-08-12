var emitdb = require('../'),
  assert = require('assert');

var db = emitdb('testdb', function ready(err, dbins) {
  console.log(dbins)
  assert.ok(!err);
  db.put('/foo', {
    foo: 1
  }, function (err) {
    assert.ok(!err);
    db.get('/foo', function (err, doc) {
      assert.ok(!err);
      assert.deepEqual(doc, {
        foo: 1
      });
      db.del('/foo', function (err) {
        assert.ok(!err);
        db.get('/foo', function (err) {
          assert.ok(err);
          assert.equal(err.name, 'NotFoundError');
        });
      });
    });
  });
});

console.log('nothing blew up? awsm, must be working then!');
// lint: 1 error
