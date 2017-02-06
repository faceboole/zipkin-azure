/**
 * Created by kevinbayes on 1/02/17.
 */
const zipkinHttpHandler = require('../src/zipkinHandler');

const chai = require('chai');

chai.config.includeStack = true;

global.expect = chai.expect;


describe('zipkinHandler - with a valid request', () => {
    it('should populate the zipkin binding correctly.', function(done) {

        let req = { headers : {}, body : "Tester", originalUrl: "http://localhost", method: "GET" };
        let context = {
            res: { status: 200 },
            bindings: { },
            log: function(message) { console.log(message); },
            done: function(err, output) { }
        };

        zipkinHttpHandler("unit-test", function (_context, _req) {

            _context.log("Testing");
            _context.done(null, {});
        })(context, req);

        expect(context.bindings.zipkin.length).to.equal(1);

        done();
    });
});
