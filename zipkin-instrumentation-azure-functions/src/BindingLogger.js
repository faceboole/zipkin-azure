/**
 * Created by kevinbayes on 31/01/17.
 */
class BindingLogger {

    constructor(context) {

        this.context = context;
    }

    logSpan(span) {

        this.context.bindings["zipkin"] = [span.toJSON()];
    }
}

module.exports = BindingLogger;