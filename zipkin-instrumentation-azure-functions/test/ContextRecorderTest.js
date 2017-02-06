/**
 * Created by kevinbayes on 1/02/17.
 */
const {Tracer, BatchRecorder, Annotation, ExplicitContext} = require('zipkin');
const CLSContext = require('zipkin-context-cls');

const ZipkinContext = require('../src/ZipkinContext');
const ContextRecorder = require('../src/ContextRecorder');

const chai = require('chai');

chai.config.includeStack = true;

global.expect = chai.expect;

class MockLogger {

    logSpan(span) {

        this.span = span.toJSON();
    }
}


describe('ZipkinContext - with a valid request', () => {
    it('should populate the span correctly', function(done) {

        const ctxImpl = new CLSContext();
        const recorder = new ContextRecorder();
        const logger = new MockLogger();

        const tracer = new Tracer({
            ctxImpl,
            recorder
        });

        const expectedResponse = '{"traceId":"32d9da1b5ef9c3cb","name":"GET","id":"32d9da1b5ef9c3cb","annotations":[{"value":"sr","timestamp":1486370505809718,"endpoint":{"serviceName":"unit-test","ipv4":"192.168.1.67","port":0}},{"value":"ss","timestamp":1486370505813164,"endpoint":{"serviceName":"unit-test","ipv4":"192.168.1.67","port":0}}],"binaryAnnotations":[{"key":"http.url","value":"http://localhost/","endpoint":{"serviceName":"unit-test","ipv4":"192.168.1.67","port":0}},{"key":"http.status_code","value":"200","endpoint":{"serviceName":"unit-test","ipv4":"192.168.1.67","port":0}}]}';

        let _req = { headers : {}, body : "Tester", originalUrl: "http://localhost", method: "GET" };
        let _context = {
            res: { status: 200 },
            bindings: { },
            log: function(message) { console.log(message); },
            done: function(err, output) { }
        };

        let context = new ZipkinContext(tracer, "unit-test", _context, _req);
        context.logger = logger;

        context.done(null, {});

        let resultSpan = logger.span;

        expect(resultSpan.name).to.equal("GET");

        expect(resultSpan.annotations.length).to.equal(2);
        expect(resultSpan.binaryAnnotations.length).to.equal(2);

        done();
    });
});
