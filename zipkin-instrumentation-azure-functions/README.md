# Azure Function App Instrumentation
This instrumentation is used within a function app to perform
tracing on javascript functions. 

# Transport Bindings 
This allows for easy integration with service bus, storage queues, eventhub, etc through a predefined binding output
binding called "zipkin". To use this feature you should just create an output binding with the name "zipkin".

# TODO
Documentation and cleanup the layout once more thought out.

####Notes
This should be done as an extension to the lower level webjob sdk.

