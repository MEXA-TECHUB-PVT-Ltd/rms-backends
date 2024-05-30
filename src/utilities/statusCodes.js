const statusCodes = [
  {
    CODE_100: 100,
    message: "Continue",
  },
  {
    CODE_101: 101,
    message: "Switching Protocols",
  },
  {
    CODE_102: 102,
    message: "Processing",
  },
  {
    CODE_103: 103,
    message: "Early Hints",
  },
  {
    CODE_200: 200,
    message: "OK",
  },
  {
    CODE_201: 201,
    message: "Created",
  },
  {
    CODE_202: 202,
    message: "Accepted",
  },
  {
    CODE_203: 203,
    message: "Non-Authoritative Information",
  },
  {
    CODE_204: 204,
    message: "No Content",
  },
  {
    CODE_205: 205,
    message: "Reset Content",
  },
  {
    CODE_206: 206,
    message: "Partial Content",
  },
  {
    CODE_207: 207,
    message: "Multi-Status",
  },
  {
    CODE_208: 208,
    message: "Already Reported",
  },
  {
    CODE_226: 226,
    message: "IM Used",
  },
  {
    CODE_300: 300,
    message: "Multiple Choices",
  },
  {
    CODE_301: 301,
    message: "Moved Permanently",
  },
  {
    CODE_302: 302,
    message: "Found",
  },
  {
    CODE_303: 303,
    message: "See Other",
  },
  {
    CODE_304: 304,
    message: "Not Modified",
  },
  {
    CODE_305: 305,
    message: "Temporary Redirect",
  },
  {
    CODE_306: 306,
    message: "Permanent Redirect",
  },
  {
    CODE_307: 307,
    message: "Bad Request",
  },
  {
    CODE_308: 308,
    message: "Unauthorized",
  },
  {
    CODE_400: 400,
    message: "Payment Required",
  },
  {
    CODE_401: 401,
    message: "Forbidden",
  },
  {
    CODE_402: 402,
    message: "Not Found",
  },
  {
    CODE_403: 403,
    message: "Method Not Allowed",
  },
  {
    CODE_404: 404,
    message: "Not Acceptable",
  },
  {
    CODE_405: 405,
    message: "Proxy Authentication Required",
  },
  {
    CODE_406: 406,
    message: "Request Timeout",
  },
  {
    CODE_407: 407,
    message: "Conflict",
  },
  {
    CODE_408: 408,
    message: "Gone",
  },
  {
    CODE_409: 409,
    message: "Length Required",
  },
  {
    CODE_410: 410,
    message: "Precondition Failed",
  },
  {
    CODE_411: 411,
    message: "Payload Too Large",
  },
  {
    CODE_412: 412,
    message: "URI Too Long",
  },
  {
    CODE_413: 413,
    message: "Unsupported Media Type",
  },
  {
    CODE_416: 416,
    message: "Range Not Satisfiable",
  },
  {
    CODE_417: 417,
    message: "Expectation Failed",
  },
  {
    CODE_418: 418,
    message: "I'm a teapot",
  },
  {
    CODE_421: 421,
    message: "Misdirected Request",
  },
  {
    CODE_422: 422,
    message: "Unprocessable Entity",
  },
  {
    CODE_423: 423,
    message: "Locked",
  },
  {
    CODE_424: 424,
    message: "Failed Dependency",
  },
  {
    CODE_425: 425,
    message: "Too Early",
  },
  {
    CODE_426: 426,
    message: "Upgrade Required",
  },
  {
    CODE_428: 428,
    message: "Precondition Required",
  },
  {
    CODE_429: 429,
    message: "Too Many Requests",
  },
  {
    CODE_431: 431,
    message: "Request Header Fields Too Large",
  },
  {
    CODE_451: 451,
    message: "Unavailable For Legal Reasons",
  },
  {
    CODE_500: 500,
    message: "Internal Server Error",
  },
  {
    CODE_501: 501,
    message: "Not Implemented",
  },
  {
    CODE_502: 502,
    message: "Bad Gateway",
  },
  {
    CODE_503: 503,
    message: "Service Unavailable",
  },
  {
    CODE_504: 504,
    message: "Gateway Timeout",
  },
  {
    CODE_505: 505,
    message: "HTTP Version Not Supported",
  },
  {
    CODE_506: 506,
    message: "Variant Also Negotiates",
  },
  {
    CODE_507: 507,
    message: "Insufficient Storage",
  },
  {
    CODE_508: 508,
    message: "Loop Detected",
  },
  {
    CODE_510: 510,
    message: "Not Extended",
  },
  {
    CODE_511: 511,
    message: "Network Authentication Required",
  },
];

module.exports = statusCodes;
