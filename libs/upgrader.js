var Fiber = require('fibers');
var Future = require('fibers/future');
var path = require('path');
var process = require('process');
var fs = Future.wrap(require('fs'));
var exec = require('child_process').exec;

var execSync = Future.wrap(function(command, callback) {
    exec(command, function(err, stdout, stderr) {
        if (!err) {
            callback(null, stdout);
        } else {
            error = err.message;
            callback(null, stdout);
        }
    });
});

var error = null;

var getCommandResult = function(command) {
    var results = execSync(command).wait();
    return results;
};

// run one alt file
var runAltFile = function(mongohost, mongodatabase, filepath, version) {
    var command = 'mongo ' + mongohost + '/' + mongodatabase +' libs/underscore.js '+filepath;
    console.log('-------');
    console.log('-- Running alt file '+filepath);
    console.log('-- Using command: '+command);
    var output = getCommandResult(command);
    console.log(output);
    console.log('-- Finished alt file '+filepath);
    console.log('-------------');

    var update = 'db.migration.update({ key: \'version\' }, { \\$set: { key: \'version\', value: ' + version + ' } }, { upsert: true });';
    command = 'mongo ' + mongohost + '/' + mongodatabase + ' --quiet --eval "'+update+'"';
    getCommandResult(command);

};

var getDatabaseVersion = function(mongohost, mongodatabase) {
    var command = 'mongo ' + mongohost + '/' + mongodatabase + ' --quiet --eval "var v = db.migration.findOne({ key: \'version\' }); if (v) { print(v.value); } else { print(0); }"';
    var version = getCommandResult(command);
    if (version.indexOf('Error') !== -1) {
        console.log('ERROR: Stopping upgrader because of MongoDB error');
        console.log(version);
        error = version;
        return false;
    }
    return parseInt(version, 10);
};

var readDirContents = function(folder) {
    return fs.readdirFuture(folder).wait();
};

var runUpgrader = function(host, db, folder, quiet) {
    quiet = quiet || false;
    if (!quiet) {
        console.log('=============');
        console.log('Upgrader started');
    }

    // read the database version
    var version = getDatabaseVersion(host, db);
    if (version === false) {
        return false;
    }

    console.log('Mongo database version:', version);
    console.log('====');

    try {
        var files = readDirContents(folder);
    } catch(e) {
        console.log('ERROR: Stopping upgrader because of filesystem error');
        console.log(e.message);
        error = e.message;
        return false;
    }

    files.filter(function(a) {
        return String(a).match('alt[0-9]+\.js') && parseInt(a.substring(3), 10) > version;
    }).sort(function(a, b) {
        return parseInt(a.substring(3), 10) < parseInt(b.substring(3), 10) ? -1 : 1;
    }).forEach(function(file, index) {
        // Make one pass and make the file complete
        var fullpath = path.join(folder, file);
        runAltFile(host, db, fullpath, parseInt(file.substring(3), 10));
    });

    console.log('Upgrader finished');
    console.log('=============');
}.future();

getLastError = function() {
    return error;
};

exports.runUpgrader = runUpgrader;
exports.getLastError = getLastError;
exports.getDatabaseVersion = getDatabaseVersion;