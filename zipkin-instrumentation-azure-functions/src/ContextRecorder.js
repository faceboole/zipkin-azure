const thriftTypes = require('zipkin/src/gen-nodejs/zipkinCore_types');
const {
    MutableSpan,
    Endpoint,
    ZipkinAnnotation,
    BinaryAnnotation
} = require('zipkin/src/internalRepresentations');

class ContextRecorder {

    constructor() {

        this.partialSpans = new Map();
    }

    _updateSpanMap(id, updater) {
        let span;
        if (this.partialSpans.has(id)) {
            span = this.partialSpans.get(id);
        } else {
            span = new MutableSpan(id);
        }
        updater(span);
        this.partialSpans.set(id, span);
    }


    _annotate(span, {timestamp}, value) {
        span.addAnnotation(new ZipkinAnnotation({
            timestamp,
            value
        }));
    }

    _binaryAnnotate(span, key, value) {
        span.addBinaryAnnotation(new BinaryAnnotation({
            key,
            value,
            annotationType: thriftTypes.AnnotationType.STRING
        }));
    }

    record(rec) {
        const id = rec.traceId;

        this._updateSpanMap(id, span => {
            switch (rec.annotation.annotationType) {
                case 'ClientSend':
                    this._annotate(span, rec, thriftTypes.CLIENT_SEND);
                    break;
                case 'ClientRecv':
                    this._annotate(span, rec, thriftTypes.CLIENT_RECV);
                    break;
                case 'ServerSend':
                    this._annotate(span, rec, thriftTypes.SERVER_SEND);
                    break;
                case 'ServerRecv':
                    this._annotate(span, rec, thriftTypes.SERVER_RECV);
                    break;
                case 'Message':
                    this._annotate(span, rec, rec.annotation.message);
                    break;
                case 'Rpc':
                    span.setName(rec.annotation.name);
                    break;
                case 'ServiceName':
                    span.setServiceName(rec.annotation.serviceName);
                    break;
                case 'BinaryAnnotation':
                    this._binaryAnnotate(span, rec.annotation.key, rec.annotation.value);
                    break;
                case 'LocalAddr':
                    span.setEndpoint(new Endpoint({
                        host: rec.annotation.host.toInt(),
                        port: rec.annotation.port
                    }));
                    break;
                case 'ServerAddr':
                    span.setServerAddr(new Endpoint({
                        serviceName: rec.annotation.serviceName,
                        host: rec.annotation.host ? rec.annotation.host.toInt() : undefined,
                        port: rec.annotation.port
                    }));
                    break;
                default:
                    break;
            }
        });
    }

    flush(traceId, logger) {

        const spanToWrite = this.partialSpans.get(traceId);

        this.partialSpans.delete(traceId);
        logger.logSpan(spanToWrite);
    }

    toString() {
        return 'ContextRecorder()';
    }
}

module.exports = ContextRecorder;
