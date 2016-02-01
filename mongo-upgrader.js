var upgrader = require('./libs/upgrader.js');
var ArgumentParser = require('argparse').ArgumentParser;
var _ = require('underscore');

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
    path: 'alts'
};

options = _.extend(options, args);

upgrader.runUpgrader(options.host, options.db, options.path);