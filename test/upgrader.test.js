var assert, fs, upgrader, mockfs, path, rewire, should;

assert = require('assert');
should = require('should');
mockfs = require('mock-fs');
fs = require('fs');
rewire = require('rewire');
path = require('path');

upgrader = rewire('../libs/upgrader.js');

describe('Basic upgrader tests', function() {
    describe('upgrade operation', function() {
        beforeEach(function() {
            var obj = {};
            obj['alts'] = {};
            return mockfs(obj);
        });
        afterEach(function() {
            return mockfs.restore();
        });
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
            var obj = {};
            obj['alts'] = {
                "alt1.js": "show databases"
            };
            mockfs(obj);

            upgrader.__set__('getDatabaseVersion', function(mongohost, mongodatabase) {
                return 1;
            });
            upgrader.__set__('runAltFile', function(mongohost, mongodatabase, filepath, version) {
                should(version).equal(1);
                should(filepath).equal('alts/alt1.js');
            });
            upgrader.__set__('readDirContents', function() {
                return ['alts/alt1.js'];
            });

            var result = upgrader.runUpgraderRaw('localhost', 'app', 'alts');
            should(result).equal(true);

            should(upgrader.getLastError()).equal(null);

            return done();
        });
    });
});