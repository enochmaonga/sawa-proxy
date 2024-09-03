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
  } = req.body;

  if (
    !name ||
    !password ||
    !email ||
    !userType
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }
  console.log("entry", req.body);
  console.log('Confirm Data:', req.body);
  let client; // Declare client outside of the try block

  try {
    const { client: initializedClient, sawacom } = await initDB();
    client = initializedClient; // Assign the initialized client to the outer client variable

    // Check for duplicates in the database
    const duplicate = await sawacom.users.findOne({ email: email });
    if (duplicate) {
      return res.status(409).json({ message: "Email already exists" });
    }

    // Encrypt the password
    const hashedPwd = await bcryptjs.hash(password, 10);

    // Store the new user with the hashed password
    const newUser = {
      name: name,
      email: email,
      password: hashedPwd,
      userType: userType,
    };

    // Insert the new user into the database
    await sawacom.users.insertOne(newUser);

    // Return an array with the new user object
    const newUserArray = [
      {
        name,
        email,
        password,
        userType,
      },
    ];
    res.status(201).json(newUserArray);
  } catch (err) {
    console.error("Error:", err.message);  // Corrected the typo here
    res.status(500).json({ message: err.message });
  } finally {
    // Close the MongoDB connection if it was established
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