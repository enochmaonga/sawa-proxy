const { MongoClient, ObjectId } = require("mongodb");

const uri = "mongodb+srv://jumaalfonse:OaaIgHwM4kf14kKP@cluster0.eikr1.mongodb.net/sawacom";

async function initDB() {
  const client = new MongoClient(uri);
  await client.connect();

  console.log("MongoDB connection established");
  const database = client.db("sawacom");
  const bookingCollection = database.collection("booking");
  const repairsCollection = database.collection("repairs");
  
  return { client, bookingCollection, repairsCollection };
}

const handleMoveToRepair = async (req, res) => {
  const { repairsId, repairCenterName, courier, waybillNumber } = req.body;

  if (!repairsId || !repairCenterName || !courier || !waybillNumber) {
    return res.status(400).json({ message: "All fields are required" });
  }

  let client;

  try {
    const { client: initializedClient, bookingCollection, repairsCollection } = await initDB();
    client = initializedClient;

    // Find the booking by ID
    const booking = await bookingCollection.findOne({ _id: new ObjectId(repairsId) });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check for duplicates in the repairs collection
    const isDuplicate = await repairsCollection.findOne({
      repairCenterName,
      courier,
      waybillNumber,
    });

    if (isDuplicate) {
      return res.status(409).json({ message: "Duplicate entry found" });
    }

    // Insert booking into the repairs collection
    const result = await repairsCollection.insertOne({
      ...booking,
      status: "Out for Repair",
      repairCenterName,
      courier,
      waybillNumber,
      repairDate: new Date(), // Add repair date
    });

    if (result.insertedCount === 0) {
      return res.status(400).json({ message: "Failed to move booking to repair center" });
    }

    // Remove the booking from the booking collection
    await bookingCollection.deleteOne({ _id: new ObjectId(repairsId) });

    res.status(200).json({ success: true, message: "Booking moved to repair center successfully" });
  } catch (err) {
    console.error("Error moving booking to repair center:", err.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    if (client) {
      await client.close();
    }
  }
};
const handleGetDispatch = async (req, res) => {
  const { userId } = req.params;
  let client;

  try {
    const { client: initializedClient, repairsCollection } = await initDB();
    client = initializedClient;
    

    // Fetch all repairs from the repairsCollection
    const repairs = await repairsCollection.find({}).toArray();

    if (!repairs.length) {
      return res.status(404).json({ message: "No repairs found" });
    }

    res.status(200).json(repairs);
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ message: err.message });
  } finally {
    if (client) {
      await client.close();
    }
  }
};

module.exports = { handleMoveToRepair, handleGetDispatch };