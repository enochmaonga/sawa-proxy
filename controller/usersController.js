const express = require("express");
const { MongoClient } = require("mongodb");
const bcryptjs = require("bcryptjs");

const uri = "mongodb+srv://jumaalfonse:OaaIgHwM4kf14kKP@cluster0.eikr1.mongodb.net/sawacom";

async function initDB() {
  const client = new MongoClient(uri);
  await client.connect();
  const database = client.db("sawacom");
  const collection = database.collection("users");
  const sawacom = {
    users: collection,
  };

  return { client, sawacom };
}

const handleNewUser = async (req, res) => {
  const {
    name,
    email,
    password,
    userType,
    repairCenter, // Add repairCenter to the body request
  } = req.body;

  // Ensure required fields are present
  if (!name || !password || !email || !userType) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // If the user is a technician, ensure that repairCenter is provided
  if (userType === "Technician" && !repairCenter) {
    return res.status(400).json({ message: "Repair center is required for technicians" });
  }

  let client;

  try {
    const { client: initializedClient, sawacom } = await initDB();
    client = initializedClient;

    // Check for existing users with the same email
    const duplicate = await sawacom.users.findOne({ email: email });
    if (duplicate) {
      return res.status(409).json({ message: "Email already exists" });
    }

    // Encrypt the password
    const hashedPwd = await bcryptjs.hash(password, 10);

    // Create the new user object
    const newUser = {
      name,
      email,
      password: hashedPwd,
      userType,
    };

    // If the user is a Technician, add repairCenter to their record
    if (userType === "Technician") {
      newUser.repairCenter = repairCenter;
    }

    // Insert the new user into the collection
    await sawacom.users.insertOne(newUser);

    // Respond with the new user data
    res.status(201).json(newUser);
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ message: err.message });
  } finally {
    if (client) {
      await client.close();
    }
  }
};

const handleDeleteUser = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  let client;

  try {
    const { client: initializedClient, sawacom } = await initDB();
    client = initializedClient;

    // Check if the user exists
    const user = await sawacom.users.findOne({ _id: ObjectID(userId) });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete the user
    await sawacom.users.deleteOne({ _id: ObjectID(userId) });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (client) {
      await client.close();
    }
  }
};

const handleGetUsers = async (req, res) => {
  let client;

  try {
    const { client: initializedClient, sawacom } = await initDB();
    client = initializedClient;

    // Fetch all users from the collection
    const users = await sawacom.users.find({}).toArray();

    if (!users.length) {
      return res.status(404).json({ message: "No users found" });
    }

    res.status(200).json(users);
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ message: err.message });
  } finally {
    if (client) {
      await client.close();
    }
  }
};

module.exports = { handleNewUser, handleDeleteUser, handleGetUsers };