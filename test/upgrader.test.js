var assert, fs, upgrader, path, rewire, should;

assert = require('assert');
should = require('should');
fs = require('fs');
rewire = require('rewire');
path = require('path');

upgrader = rewire('../libs/upgrader.js');

describe('Basic upgrader tests', function() {
    describe('upgrade operation', function() {
        it("runUpgrader should exist", function(done) {
            upgrader.runUpgrader.should.exist;
            return done();
        });
        it("readOptions should exist", function(done) {
            upgrader.readOptions.should.exist;
            return done();
        });
        it("getDatabaseVersion should exist", function(done) {
            upgrader.getDatabaseVersion.should.exist;
            return done();
        });
        it("getLastError should exist", function(done) {
            upgrader.getLastError.should.exist;
            return done();
        });
        it("should be able to run alt files in specified path and have database version updated", function(done) {
            upgrader.__with__({
                'getDatabaseVersion': function (mongohost, mongodatabase) {
                    return 1;
                },
                'runAltFile': function (mongohost, mongodatabase, filepath, version) {
                    should(version).equal(1);
                    should(filepath).equal('alts/alt1.js');
                },
                'readDirContents': function() {
                    return ['alt1.js'];
                }
            })(function() {
                var result = upgrader.runUpgraderRaw('localhost', 'app', 'alts');
                should(result).equal(true);
                should(upgrader.getLastError()).equal(null);
            });

            return done();
        });
        it("should be able to run upgrader and stop when can't connect to mongo", function(done) {
            upgrader.__with__({
                'getCommandResult': function (command) {
                    return "Error: couldn't connect to server localhost:27017 (127.0.0.1), connection attempt failed";
                }
            })(function() {
                var result = upgrader.runUpgraderRaw('localhost', 'app', 'alts');
                should(typeof result).equal('object');
                should(result[0]).equal(false);
                should(upgrader.getLastError()).equal("Error: couldn't connect to server localhost:27017 (127.0.0.1), connection attempt failed");
            });

            return done();
        });
        it("should be able to run upgrader when no alt files exist in folder", function(done) {
            upgrader.__with__({
                'getDatabaseVersion': function(mongohost, mongodatabase) {
                    return 1;
                },
                'readDirContents': function() {
                    return [];
                },
                'runAltFile': function(mongohost, mongodatabase, path, version) {
                    should('runAltFile not').equal('called');
                }
            })(function() {
                var result = upgrader.runUpgraderRaw('localhost', 'app', 'alts');
                should(result).equal(true);
                should(upgrader.getLastError()).equal(null);
            });

            return done();
        });
        it("should be able to run upgrader when there's no specified folder and get an error", function(done) {
            upgrader.__with__({
                'getDatabaseVersion': function (mongohost, mongodatabase) {
                    return 0;
                },
                'readDirContents': function () {
                    throw new Error('No such directory');
                }
            })(function() {
                var result = upgrader.runUpgraderRaw('localhost', 'app', 'some_wrong_folder');
                should(typeof result).equal('object');
                should(result[0]).equal(false);
                should(upgrader.getLastError()).equal('No such directory');
            });

            return done();
        });

        it("should be able to run upgrader for specific number of alt files based on database version", function(done) {
            upgrader.__with__({
                'getDatabaseVersion': function(mongohost, mongodatabase) {
                    return 2;
                },
                'readDirContents': function() {
                    return ['alt1.js', 'alt2.js', 'alt3.js', 'alt4.js'];
                },
                'runAltFile': function(mongohost, mongodatabase, path, version) {
                    upgrader.run_amount++;
                }
            })(function() {
                upgrader.run_amount = 0;
                var result = upgrader.runUpgraderRaw('localhost', 'app', 'alts');
                should(result).equal(true);
                should(upgrader.getLastError()).equal(null);
                should(upgrader.run_amount).equal(2);
            });

            return done();
        });

        it("should be able to run upgrader for and execute zero alt files based on database version", function(done) {
            upgrader.__with__({
                'getDatabaseVersion': function(mongohost, mongodatabase) {
                    return 4;
                },
                'readDirContents': function() {
                    return ['alt1.js', 'alt2.js', 'alt3.js', 'alt4.js'];
                },
                'runAltFile': function(mongohost, mongodatabase, path, version) {
                    upgrader.run_amount++;
                }
            })(function() {
                upgrader.run_amount = 0;
                var result = upgrader.runUpgraderRaw('localhost', 'app', 'alts');
                should(result).equal(true);
                should(upgrader.getLastError()).equal(null);
                should(upgrader.run_amount).equal(0);
            });

            return done();
        });
    });
});