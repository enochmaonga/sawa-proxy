require('dotenv').config();
const { MongoClient } = require("mongodb");
const africastalking = require("africastalking")({
  apiKey: process.env.AT_API_KEY,  // From .env file
  username: process.env.AT_USERNAME,
});

console.log("API Key:", process.env.AT_API_KEY);  
console.log("API Key:", process.env.AT_USERNAME); 

const SMS = africastalking.SMS;

const uri =
  "mongodb+srv://jumaalfonse:OaaIgHwM4kf14kKP@cluster0.eikr1.mongodb.net/sawacom";

async function initDB() {
  const client = new MongoClient(uri);
  await client.connect();
  console.log("MongoDB connection established");
  const database = client.db("sawacom");
  const collection = database.collection("booking");
  return { client, sawacom: { booking: collection } };
}


const sendSMS = async (phoneNumber, message) => {
  try {
    // Ensure the phone number is in the correct format (e.g., 2547XXXXXXXX)
    const formattedPhoneNumber = phoneNumber.startsWith("+")
      ? phoneNumber.substring(1) // Remove leading '+'
      : phoneNumber; 

    // Validate that the phone number starts with the country code (e.g., 254 for Kenya)
    if (!formattedPhoneNumber.startsWith("254")) {
      throw new Error("Phone number must start with the country code (e.g., 254 for Kenya)");
    }

    console.log("Formatted Phone Number:", formattedPhoneNumber); // Log the formatted phone number

    const response = await SMS.send({
      to: [`+${formattedPhoneNumber}`], // Ensure leading '+' is added back
      message: message,
    });

    console.log("SMS sent successfully", response); // Log success response
    console.log("Final phone number being sent:", `+${formattedPhoneNumber}`);
    console.log("SMS sent successfully", JSON.stringify(response, null, 2));
  } catch (error) {
    // Log the full error response
    console.error("Error sending SMS:", error.response ? error.response.data : error.message);
  }
};

const isEntryDuplicate = async (sawacom, booking) => {
  const existingEntry = await sawacom.booking.findOne({
    customerName: booking.customerName,
    phoneNumber: booking.phoneNumber,
    email: booking.email,
    phoneMake: booking.phoneMake,
    phoneModel: booking.phoneModel,
    imei: booking.imei,
    phoneIssues: booking.phoneIssues,
  });
  return existingEntry !== null;
};

const handleNewEntry = async (req, res) => {
  console.log("Request body:", req.body);  // Log request body
  const {
    customerName,
    phoneNumber,
    email,
    phoneMake,
    phoneModel,
    imei,
    phoneIssues,
  } = req.body;

  if (!customerName || !phoneNumber || !email || !phoneMake || !phoneModel || !imei || !phoneIssues) {
    return res.status(400).json({ message: "All fields are required" });
  }

  let client;

  try {
    const { client: initializedClient, sawacom } = await initDB();
    client = initializedClient;
    const createdAt = new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });

    const booking = {
      customerName,
      phoneNumber,
      email,
      phoneMake,
      phoneModel,
      imei,
      phoneIssues,
      createdAt,
    };

    const isDuplicated = await isEntryDuplicate(sawacom, booking);
    if (isDuplicated) {
      return res.status(400).json({
        success: false,
        message: "Duplicate entry detected",
        errorType: "duplicate",
      });
    }

    await sawacom.booking.insertOne(booking);
    console.log("New Entry inserted into the database");

    // Send SMS notification
    const smsMessage = `Dear ${customerName}, your phone (${phoneMake} ${phoneModel}) has been successfully booked with IMEI: ${imei}, issues: ${phoneIssues}.`;
    await sendSMS(phoneNumber, smsMessage);

    res.status(201).json({
      success: true,
      data: [booking],
      message: "Entry created successfully",
    });
  } catch (err) {
    console.error("Error processing new entry:", err.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      errorType: "internal_error",
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
};

const handleGetBooking = async (req, res) => {
  let client;
  try {
    const { client: initializedClient, sawacom } = await initDB();
    client = initializedClient;
    const booking = await sawacom.booking.find({}).toArray();
    if (!booking.length) {
      return res.status(404).json({ message: "No booking found" });
    }
    res.status(200).json(booking);
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ message: err.message });
  } finally {
    if (client) {
      await client.close();
    }
  }
};

module.exports = { handleNewEntry, handleGetBooking };