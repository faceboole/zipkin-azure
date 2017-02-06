const { Tracer } = require('zipkin');
const CLSContext = require('zipkin-context-cls');
const ContextRecorder = require('./ContextRecorder');
const ZipkinContext = require('./ZipkinContext');

const url = require('url');

const ctxImpl = new CLSContext();
const recorder = new ContextRecorder();

const tracer = new Tracer({
    ctxImpl,
    recorder
});

module.exports = function zipkinHttpHandler(serviceName, callback) {

    return function(context, req) {

        let zipkinContext = new ZipkinContext(tracer, serviceName, context, req);

        try {

            callback(zipkinContext, req);
        } catch (e) {

            zipkinContext.res = {
                status: 500,
                message: e
            };

            try {

                zipkinContext.done(e, {});
            } catch(e2) {

                let res = {
                    status: 500,
                    body: e2
                };

                context.log(`Unable to log trace: ${e2}`);
                context.done(e2, res);
            }
        }
    };
};