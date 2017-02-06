/**
 * Created by kevinbayes on 1/02/17.
 */
const chai = require('chai');

chai.config.includeStack = true;

const BindingLogger = require('../src/BindingLogger');

describe('BindingLogger - writeSpan', () => {
    it('should result in a context.bindings.zipkin property being populated', function(done) {

        let context = { bindings : {} };

        const logger = new BindingLogger(context);

        logger.logSpan({ toJSON : function() { return {"traceId": "21fc63b2edd18b22"} }});

        chai.expect(context.bindings.zipkin.length).to.equal(1);
        chai.expect(context.bindings.zipkin[0].traceId).to.equal("21fc63b2edd18b22");

        done();
    });
});
