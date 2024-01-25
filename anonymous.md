#### HTTP

```js

http headers: 
    metadata -> key-value sent along with req and res

    caching, auth, manage state
    req headers -> from client
    res headers -> from server
    representation headers -> encoding/compression
    payload headers -> data
    and many more

Most common headers
    Accept : application/json
    User-Agent 
    Authorization
    Content-type
    Cookie
    Cache-Control


Status Codes

1xx Informational   2xx Success     3xx Redirection
4xx Client error        5xx Server error

    100 Continue
    102 Processing
    200 ok
    201 created
    202 accepted
    307 temporary redirect
    308 Permanent redirect
    400 Bad req
    401 unauthorized
    402 Payment required
    404 not found
    500 internal server error
    504 Gateway time out

```

#### Controllers

