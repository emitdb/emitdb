var fs = require('fs'),
  async = require('async'),
  path = require('path'),
  dotfile = require('dotfile'),
  levelup = require('levelup'),
  //  idx = require('idx'),
  default_cfg = require('../cfg');

/**
 * Main class for the EmitDB
 *
 * @author dscape
 */

function EmitDB(db_name, options, next) {
  var instance = this;

  //
  // if you don't understand this consider
  // reading some js books first :)
  //
  // ps. it's fairly simply, js doesn't do varying number of
  // arguments and coders like mehself have to write
  // silly lines of code like this
  //
  // most of them have the common sense of at least not acknowledging the
  // fact. obviously, i am not one of those persons
  //
  if (typeof options === 'function') {
    next = options;
    options = {};
  }

  //
  // calculate the full name for this db
  // mostly to avoid naming/folder/file collisions
  // defensive programming sucks, but i just did it
  // *shame*
  //
  var full_name = 'emitdb_' + db_name;

  //
  // set the directory name
  // this way, in the future, we can support
  // people putting their files somewhere else
  //
  var dirname = options.dirname ? options.dirname : path.join(__dirname, '..', 'data');

  //
  // sets a dotfile in your home directory containing
  // your configuration for this database
  //
  // e.g. ~/.emitdb_bardb.json
  //
  var dotcfg = dotfile(full_name, {
    dirname: dirname
  });

  //
  // set some sane defaults for inspection
  // on use
  //
  instance.cfg = default_cfg;
  instance.db_name = db_name;
  instance.options = options;
  instance.dotfile = dotcfg;

  //
  // on a successful cfg file read
  // we set stuff here
  //

  function ok() {
    //
    // create/use the database file
    //
    instance.db = levelup(path.join(dirname, full_name) + '_dat', {
      encoding: 'json'
    });

    //
    // try to see if we have an index specification
    //
    instance.indexes = instance.cfg && instance.cfg.indexes ? Object.keys(instance.cfg.indexes) : null;

    //
    // we could just add some base indexers here
    // but its more likely that someone tampered with the config
    // file so better just quit and warn user
    //
    if (!instance.indexes) {
      return next(new Error(
        ['No `indexes` property was found in your config.',
        'This might sympton of a larger problem so',
        ' please investigate your file at ', dotcfg.filepath
        ].join('')));
    }

    //
    // get our indexes database file
    //
    //instance.idx = idx(path.join(dirname, full_name) + '_idx');

    //
    // ready for dinoparty, common!
    // *sings a tune*
    //
    next(null, instance);
  }

  //
  // if the dotfile already exists we should use it
  // and in case of error we should notify as the dotfile
  // describes the indexes
  //
  dotcfg.exists(function (exists) {
    if (exists) {
      //
      // read the cfg dotfile from disk
      //
      dotcfg.read(function (err, cfg) {
        if (err) {
          return next(err);
        }
        //
        // overrides the cfg with the one fetched from
        // file
        //
        instance.cfg = cfg;
        ok();
      });
    } else {
      //
      // attempt a first save
      //
      dotcfg.write(instance.cfg, function (err, cfg) {
        if (err) {
          return next(err);
        }
        ok();
      });
    }
  });
}

/**
 * Stores a document in EmitDB
 *
 * This will store the document and index it according to the db.config()
 *
 * @param {String} path The unique key that identifies this document
 * @param {Object} document The JSON document you want to store
 * @param {Object} options Allows you to specify metadata for this document,
 *   e.g. {collections: ['foo', 'bar']}
 *
 */

EmitDB.prototype.put = function (path, document, options, callback) {
  var instance = this;

  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  async.series([
  //
  // store the document
  //
  function store_document(next) {
      instance.db.put(path, document, next);
  }], callback);
};

/**
 * Get a document from EmitDB
 *
 * This will fetch the document
 *
 * @param {String} path The unique key that identifies this document
 *
 */

EmitDB.prototype.get = function (path, callback) {
  var instance = this;
  instance.db.get(path, callback);
};

/**
 * Deletes a document in EmitDB
 *
 * This will delete the document and respective indexes
 *
 * @param {String} path The unique key that identifies this document
 *
 */

EmitDB.prototype.del = function (path, callback) {
  var instance = this;
  async.series([
  //
  // delete the document
  //
  function destroy_document(next) {
      instance.db.del(path, next);
  }], callback);
};

/**
 * Returns the configuration of the database
 *
 * @returns The configuration of the
 * @type Object
 */

EmitDB.prototype.config = function () {
  return this.cfg;
};

module.exports = function (opts, next) {
  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  }

  //
  // set some default options from env is such is provided
  //
  if (typeof process.env.EMITDB_DIRNAME === 'string') {
    opts.dirname = process.env.EMITDB_DIRNAME;
  }

  return new EmitDB(opts, next);
};
