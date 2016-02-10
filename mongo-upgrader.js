var upgrader = require('./libs/upgrader.js');

options = upgrader.readOptions();
upgrader.runUpgrader(options.host, options.db, options.path);