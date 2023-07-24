const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fiktc6e.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const collegeCollection = client.db("collegeNestDB").collection("colleges");
    const userCollection = client.db("collegeNestDB").collection("users");
    const appliedCollegeCollection = client
      .db("collegeNestDB")
      .collection("appliedColleges");
    const feedbackCollection = client
      .db("collegeNestDB")
      .collection("feedbacks");

    //creating search index for college name
    await collegeCollection.createIndex({ collegeName: 1 });

    //post user  to server
    app.post("/users", async (req, res) => {
      const userInfo = req.body;
      if (await userCollection.findOne({ email: userInfo.email })) {
        return res.send({ login: true });
      }
      const result = await userCollection.insertOne(userInfo);
      res.send(result);
    });

    //get single user data
    app.get("/users/:email", async (req, res) => {
      const userEmail = req.params.email;
      const query = { email: userEmail };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    //update a user data
    app.patch("/users/:email", async (req, res) => {
      const userData = req.body;
      const userEmail = req.params.email;
      const query = { email: userEmail };
      const updateDoc = {
        $set: { ...userData },
      };
      const result = await userCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    //post applied college
    app.post("/appliedCollege", async (req, res) => {
      const applicationData = req.body;
      const result = await appliedCollegeCollection.insertOne(applicationData);
      res.send(result);
    });

    //get applied College data for a user
    app.get("/appliedCollege/:userEmail", async (req, res) => {
      const email = req.params.userEmail;
      const query = { candidateEmail: email };
      const result = await appliedCollegeCollection.find(query).toArray();
      res.send(result);
    });

    //get all college
    app.get("/colleges", async (req, res) => {
      const result = await collegeCollection.find().toArray();
      res.send(result);
    });

    //get college data by college name
    app.get("/colleges/search", async (req, res) => {
      const collegeName = req.query.collegeName;
      try {
        const regex = new RegExp(collegeName, "i"); // Case-insensitive search
        const result = await collegeCollection
          .find({ collegeName: regex })
          .toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
      }
    });

    //get single college
    app.get("/colleges/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await collegeCollection.findOne(query);
      res.send(result);
    });

    //  post feedback data
    app.post("/feedback", async (req, res) => {
      const feedbackInfo = req.body;
      const result = await feedbackCollection.insertOne(feedbackInfo);
      res.send(result);
    });

    //get all feedback
    app.get("/feedback", async (req, res) => {
      const result = await feedbackCollection
        .find()
        .sort({ createdAt: -1 })
        .toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("College nest is running");
});
app.listen(port, () => {
  console.log("College nest is running at port", port);
});
