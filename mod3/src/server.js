import "dotenv/config";
import express from "express";
import { MongoClient, ObjectId } from "mongodb";

const app = express();
const port = process.env.PORT || 3000;

const mongoUri =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/express_app";

const client = new MongoClient(mongoUri);

app.use(express.json());

let items;

// Get all items
app.get("/items", async (req, res) => { 
  try {
    const results = await items.find().sort({ createdAt: -1 }).toArray();

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

// Create an item
app.post("/items", async (req, res) => {
  try {
    const { name, description = "" } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({
        error: "name is required and must be a string",
      });
    }

    const newItem = {
      name: name.trim(),
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await items.insertOne(newItem);

    res.status(201).json({
      _id: result.insertedId,
      ...newItem,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create item" });
  }
});

// Get one item
app.get("/items/:id", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid item ID" });
    }

    const item = await items.findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch item" });
  }
});

// Delete one item
app.delete("/items/:id", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid item ID" });
    }

    const result = await items.deleteOne({
      _id: new ObjectId(req.params.id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete item" });
  }
});

async function startServer() {
  try {
    await client.connect();

    const database = client.db();
    items = database.collection("items");

    console.log("Connected to MongoDB");

    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
}

async function shutDown() {
  await client.close();
  console.log("MongoDB connection closed");
  process.exit(0);
}

process.on("SIGINT", shutDown);
process.on("SIGTERM", shutDown);

startServer();
