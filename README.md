# Zipkin for Azure Function Apps
## Overview
Zipkin Azure Library for Distributed Tracing

# Modules

## zipkin-instrumentation-azure-functions
A wrapper for function apps http request. Later will extend for more bindings.

### Example Usage

```javascript
const zipkinHttpHandler = require('zipkin-instrumentation-azure-functions');

module.exports = zipkinHttpHandler("name", function (context, req) {

    res = {
        status: 200,
        body: "Done!"
    };
    context.done(null, res);
});
```

# Disclaimer
This library in alpha and should not be used in production, yet.