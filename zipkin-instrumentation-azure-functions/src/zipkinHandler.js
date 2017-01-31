/**
 * Created by kevinbayes on 31/01/17.
 */
const {
    Annotation,
    HttpHeaders: Header,
    option: {Some, None},
    TraceId
} = require('zipkin');
const url = require('url');

function containsRequiredHeaders(req) {

    return req.headers[Header.TraceId] !== undefined &&
        req.headers[Header.SpanId] !== undefined;
}

function stringToBoolean(str) {
    return str === '1';
}

function stringToIntOption(str) {
    try {
        return new Some(parseInt(str));
    } catch (err) {
        return None;
    }
}

function formatRequestUrl(req) {
    const parsed = url.parse(req.originalUrl);
    return url.format({
        protocol: req.protocol,
        host: req.get('host'),
        pathname: parsed.pathname,
        search: parsed.search
    });
}

class ZipkinContext {

    constructor(_tracer, _serviceName, _context, _req) {

        this._tracer = _tracer;
        this._serviceName = _serviceName;

        this._context = _context;
        this._containsHeaders = containsRequiredHeaders(_req);
        this._req = _req;
        this.bindings = this._context.bindings;
        this.res = this._context.res;

        this.timestamp = new Date();
    }

    private initTrace() {

        this._tracer.scoped(() => {
            if (this._containsHeaders) {

                const spanId = this.readHeader(Header.SpanId);
                spanId.ifPresent(sid => {
                    const traceId = readHeader(Header.TraceId);
                    const parentSpanId = readHeader(Header.ParentSpanId);
                    const sampled = readHeader(Header.Sampled);
                    const flags = readHeader(Header.Flags).flatMap(stringToIntOption).getOrElse(0);
                    const id = new TraceId({
                        traceId,
                        parentId: parentSpanId,
                        spanId: sid,
                        sampled: sampled.map(stringToBoolean),
                        flags
                    });
                    this._tracer.setId(id);
                });
            } else {

                this._tracer.setId(this._tracer.createRootId());
                if (req.header(Header.Flags)) {
                    const currentId = this._tracer.id;
                    const idWithFlags = new TraceId({
                        traceId: currentId.traceId,
                        parentId: currentId.parentId,
                        spanId: currentId.spanId,
                        sampled: currentId.sampled,
                        flags: this.readHeader(Header.Flags)
                    });
                    this._tracer.setId(idWithFlags);
                }
            }

            const id = tracer.id;

            this._tracer.recordServiceName(this._serviceName);
            this._tracer.recordRpc(this._req.method);
            this._tracer.recordBinary('http.url', formatRequestUrl(this._req));
            this._tracer.recordAnnotation(new Annotation.ServerRecv());
            this._tracer.recordAnnotation(new Annotation.LocalAddr({port}));

            if (id.flags !== 0 && id.flags != null) {
                this._tracer.recordBinary(Header.Flags, id.flags.toString());
            }
        });
    }

    public readHeader(header) {
        const val = this._req.headers[header];
        if (val != null) {
            return new Some(val);
        } else {
            return None;
        }
    }

    public log(message) {

        this._context.log(message);
    }

    public done(err, propertyBag) {

        this._tracer.scoped(() => {
            this._tracer.setId(id);
            this._tracer.recordBinary('http.status_code', this._context.res.status);
            this._tracer.recordAnnotation(new Annotation.ServerSend());
        });

        this._context.done(err, propertyBag);
    }
}

module.exports = function zipkinHttpHandler({tracer, serviceName = 'unknown', callback}) {

    return function(context, req) {

        let zipkinContext = new ZipkinContext(tracer, serviceName, context, req);

        try {

            callback(zipkinContext, req);
        } catch (e) {

            zipkinContext.res = {
                status: 500,
                message: e
            };

            zipkinContext.done(e, {});
        }
    };
};