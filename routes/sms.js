const africastalking = require("africastalking")({
    apiKey: process.env.AT_API_KEY,
    username: process.env.AT_USERNAME,
  });
  
  const SMS = africastalking.SMS;
  
  SMS.send({
    to: ["+254722737989"], // replace with a valid number
    message: "Test SMS",
  })
  .then(response => console.log("SMS response:", response))
  .catch(error => console.error("SMS error:", error));