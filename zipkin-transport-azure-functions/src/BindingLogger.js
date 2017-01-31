/**
 * Created by kevinbayes on 31/01/17.
 */
/* eslint-disable no-console */

class BindingLogger {

    constructor({context}) {
        this.context = context;
        this.queue = [];
    }

    logSpan(span) {
        this.queue.push(span.toJSON());
    }

    processQueue() {
        if (this.queue.length > 0) {
            const postBody = JSON.stringify(this.queue);

            this.context.bindings["zipkin"] = postBody;
            this.queue.length = 0;
        }
    }
}

module.exports = BindingLogger;