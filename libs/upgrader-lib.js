var Fiber = require('fibers');
var Future = require('fibers/future');
var path = require('path');
var process = require('process');
var fs = Future.wrap(require('fs'));
var exec = Future.wrap(require('child_process').exec);
var wildcard = require('wildcard');

var getCommandResult = function(command) {
    var future = new Future;
    exec(command, function(error, stdout, stderr) {
        future.return(stdout);
    });
    future.wait();
    return future.get();
};

// run one alt file
var runAltFile = function(mongohost, mongodatabase, filepath, version) {
    var command = 'mongo ' + mongohost + '/' + mongodatabase +' libs/underscore.js '+filepath;
    console.log('-------');
    console.log('-- Running alt file '+filepath);
    console.log('-- Using command: '+command);
    var future = new Future;
    exec(command, function(error, stdout, stderr) {
        if (stderr) {
            console.error(stderr);
        }
        console.log(stdout);
        console.log('-- Finished alt file '+filepath);
        console.log('-------------');
        future.return();
    });
    future.wait();

    var update = 'db.migration.update({ key: \'version\' }, { \\$set: { key: \'version\', value: ' + version + ' } }, { upsert: true });';
    command = 'mongo ' + mongohost + '/' + mongodatabase + ' --quiet --eval "'+update+'"';
    getCommandResult(command);
};

var getDatabaseVersion = function(mongohost, mongodatabase) {
    var command = 'mongo ' + mongohost + '/' + mongodatabase + ' --quiet --eval "var v = db.migration.findOne({ key: \'version\' }); if (v) { print(v.value); } else { print(0); }"';
    var version = getCommandResult(command);
    if (version.indexOf('Error') !== -1) {
        console.log(version);
        console.log('Upgrader stopped because of connection error');
        process.exit();
    }
    return parseInt(version, 10);
};

var runMigration = function(options) {
    console.log('===========');
    console.log('Upgrader started');

    // read the database version
    var version = getDatabaseVersion(options.host, options.db);
    console.log('Mongo database version:', version);
    console.log('====');

    var files = fs.readdirFuture(options.folder).wait();

    files.filter(function(a) {
        return wildcard('alt*.js', a) && parseInt(a.substring(3), 10) > version;
    }).sort(function(a, b) {
        return parseInt(a.substring(3), 10) < parseInt(b.substring(3), 10) ? -1 : 1;
    }).forEach(function(file, index) {
        // Make one pass and make the file complete
        var fullpath = path.join(options.folder, file);
        runAltFile(options.host, options.db, fullpath, parseInt(file.substring(3), 10));
    });

    console.log('Upgrader finished');
    console.log('===========');
};

runMigrationFuture = function(options) {
    // create a fiber, get current database version, get all migration files, sort by number, run each one by one
    Fiber(function(options) {
        runMigration(options);
    }).run(options);
};
