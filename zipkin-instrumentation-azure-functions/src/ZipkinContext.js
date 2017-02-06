/**
 * Created by kevinbayes on 6/02/17.
 */
const {
    Annotation,
    HttpHeaders: Header,
    option: {Some, None},
    TraceId
} = require('zipkin');

const BindingLogger = require('../src/BindingLogger');

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
    const parsed = (req.originalUrl && req.originalUrl.indexOf("?") > 0) ?
        url.parse(req.originalUrl.substr(0, req.originalUrl.indexOf("?"))) : url.parse(req.originalUrl);
    return url.format({
        protocol: parsed.protocol,
        host: parsed.host,
        pathname: parsed.pathname,
        search: parsed.search
    });
}

class ZipkinContext {

    constructor(_tracer, _serviceName, _context, _req) {

        this._tracer = _tracer;
        this._serviceName = _serviceName;
        this.logger = new BindingLogger(this);

        this._context = _context;
        this._containsHeaders = containsRequiredHeaders(_req);
        this._req = _req;

        this.invocationId = this._context.invocationId;
        this.bindings = this._context.bindings;
        this.bindingData = this._context.bindingData;
        this.res = this._context.res;

        this.initTrace();
    }


    initTrace() {

        this._tracer.scoped(() => {
            if (this._containsHeaders) {

                const spanId = this.readHeader(Header.SpanId);
                spanId.ifPresent(sid => {
                    const traceId = this.readHeader(Header.TraceId);
                    const parentSpanId = this.readHeader(Header.ParentSpanId);
                    const sampled = this.readHeader(Header.Sampled);
                    const flags = this.readHeader(Header.Flags).flatMap(stringToIntOption).getOrElse(0);
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
                if (this._req.headers[Header.Flags]) {
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

            this.id = this._tracer.id;

            this._tracer.recordServiceName(this._serviceName);
            this._tracer.recordRpc(this._req.method);
            this._tracer.recordBinary('http.url', formatRequestUrl(this._req));
            this._tracer.recordAnnotation(new Annotation.ServerRecv());
            this._tracer.recordAnnotation(new Annotation.LocalAddr("localhost", 80));

            if (this.id.flags !== 0 && this.id.flags != null) {
                this._tracer.recordBinary(Header.Flags, this.id.flags.toString());
            }
        });
    }

    readHeader(header) {
        const val = this._req.headers[header];
        if (val != null) {
            return new Some(val);
        } else {
            return None;
        }
    }

    log(message) {

        this._context.log(message);
    }

    done(err, propertyBag) {

        this._tracer.scoped(() => {

            var status = (propertyBag && propertyBag.status) ? propertyBag.status : this.res.status;
            if(!status) status = 200;

            this._tracer.setId(this.id);
            this._tracer.recordBinary('http.status_code', `${status}`);
            this._tracer.recordAnnotation(new Annotation.ServerSend());
            this._tracer.recorder.flush(this.id, this.logger);
        });

        this._context.done(err, propertyBag);
    }
}

module.exports = ZipkinContext;