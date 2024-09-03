const { MongoClient } = require("mongodb");
const bcryptjs = require("bcryptjs");

const uri =
  "mongodb+srv://jumaalfonse:OaaIgHwM4kf14kKP@cluster0.eikr1.mongodb.net/sawacom";

async function initDB() {
  const client = new MongoClient(uri);
  await client.connect();

  console.log("MongoDB connection established");
  const database = client.db("sawacom");
  const collection = database.collection("booking");
  const sawacom = {
    booking: collection,
  };

  return { client, sawacom };
}

const isEntryDuplicate = async (sawacom, booking) => {
  const existingEntry = await sawacom.booking.findOne({
    // Define your criteria for duplicate checking, for example:

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
  const {
    customerName,
    phoneNumber,
    email,
    phoneMake,
    phoneModel,
    imei,
    phoneIssues,
  } = req.body;

  if (
    !customerName ||
    !phoneNumber ||
    !email ||
    !phoneMake ||
    !phoneModel ||
    (!imei  === undefined || imei === '') ||
    (!phoneIssues === undefined || phoneIssues === '')
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  let client; // Declare client outside of the try block

  try {
    const { client: initializedClient, sawacom } = await initDB();
    client = initializedClient; // Assign the initialized client to the outer client variable
    console.log("Database initialized");
    // Create a new booking object
    const createdAt = new Date();
    const formattedCreatedAt = createdAt.toLocaleString("en-US", {
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
      createdAt: formattedCreatedAt,
    };

    //check duplicate booking
    const isDuplicated = await isEntryDuplicate(sawacom, booking);
    if (isDuplicated) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Duplicate entry detected",
          errorType: "duplicate",
        });
    }

    // Insert the new booking into the database
    await sawacom.booking.insertOne(booking); // Corrected line
    console.log("New Entry inserted into the database");

    // Return an array with the new booking object
    const formArray = [booking];
    res
      .status(201)
      .json({
        success: true,
        data: formArray,
        message: "Entry created successfully",
      });
  } catch (err) {
    console.error("Error processing new entry:", err.message);
    res
      .status(500)
      .json({
        success: false,
        message: "Internal server error",
        errorType: "internal_error",
      });
  } finally {
    // Close the MongoDB connection if it was established
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
  
      // Fetch all booking from the collection
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
  
  module.exports = { handleNewEntry, handleGetBooking};
