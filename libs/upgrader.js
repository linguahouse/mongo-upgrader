var Future = require('fibers/future');
var path = require('path');
var fs = Future.wrap(require('fs'));
var exec = require('child_process').exec;
var ArgumentParser = require('argparse').ArgumentParser;
var _ = require('underscore');

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

var updateDatabaseVersion = function(mongohost, mongodatabase, version) {
    var update = 'db.migration.update({ key: \'version\' }, { \\$set: { key: \'version\', value: ' + version + ' } }, { upsert: true });';
    command = 'mongo ' + mongohost + '/' + mongodatabase + ' --quiet --eval "'+update+'"';
    return getCommandResult(command);
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
    updateDatabaseVersion(mongohost, mongodatabase, version);
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

var readOptions = function() {
    var parser = new ArgumentParser({
        version: '0.0.1',
        addHelp: true,
        description: 'Mongo Migration script'
    });

    parser.addArgument(
        [ '-u', '--host', '--url' ],
        {
            help: 'MongoDB host address',
            required: true
        }
    );
    parser.addArgument(
        [ '-d', '--database' ],
        {
            help: 'MongoDB database name',
            required: true
        }
    );
    parser.addArgument(
        [ '-f', '--folder' ],
        {
            help: 'MongoDB migration scripts path',
            required: true
        }
    );

    var args_dirty = parser.parseArgs();
    var args = {};
    _.mapObject(args_dirty, function(item, key) {
        if (item !== null) {
            args[key] = item;
        }
    });

    var options = {
        host: 'localhost',
        db: 'app',
        folder: 'alts'
    };

    options = _.extend(options, args);
    return options;
};

var runUpgraderRaw = function(host, db, folder, quiet) {
    quiet = quiet || false;
    if (!quiet) {
        console.log('=============');
        console.log('Upgrader started');
    }
    error = null;

    // read the database version
    var version = getDatabaseVersion(host, db);
    if (version === false) {
        return [false, 'Couldn\'t detect database version'];
    }

    if (!quiet) {
        console.log('Mongo database version:', version);
        console.log('====');
    }

    try {
        var files = readDirContents(folder);
    } catch(e) {
        console.log('ERROR: Stopping upgrader because of filesystem error');
        console.log(e.message);
        error = e.message;
        return [false, 'Couldn\'t read alt file contents'];
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

    if (!quiet) {
        console.log('Upgrader finished');
        console.log('=============');
    }
    return true;
};

var runUpgrader = runUpgraderRaw.future();

getLastError = function() {
    return error;
};

exports.readOptions = readOptions;
exports.runUpgrader = runUpgrader;
exports.runUpgraderRaw = runUpgraderRaw; // for tests
exports.getLastError = getLastError;
exports.getDatabaseVersion = getDatabaseVersion;