const responseMessage = require("../utils/responseMessage");

function wrapResponse(req, res, next) {
   if(res.json){
      const originalSend = res.json
      // Override the send method to intercept JSON responses
        res.json = function (body) {
          const newBody =  responseMessage(res.statusCode,body)
          // Call the original send method to send the response
          originalSend.call(this, newBody);
        };
   }
    next()
  }

  module.exports = wrapResponse