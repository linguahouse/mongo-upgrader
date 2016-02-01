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
        it("should be able to run alt files in specified path and have database version updated", function(done) {
            var obj = {};
            obj['alts'] = {
                "alt1.js": "show databases"
            };
            mockfs(obj);
            upgrader.runUpgrader('localhost', 'app', 'alts');
            should(upgrader.getLastError()).equal(null);

            return done();
        });
    });
});