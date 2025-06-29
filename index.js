const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors());
app.use(express.json());

// mongodb connnection

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.oesmq38.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    const menuColl = client.db("dinepro").collection("menu");
    const reviewColl = client.db("dinepro").collection("reviews");
    const cartColl = client.db("dinepro").collection("carts");
    const userColl = client.db("dinepro").collection("users");

    // user collection

    app.post("/users",async(req,res)=>{
      const user = req.body;
      const query = {email:user.email}
      const existingUser = await userColl.findOne(query);
      if(existingUser) return res.send({message:'user already exist'})
      const result = await userColl.insertOne(user);
      res.send(result);
    })


    // menu coll
    app.get("/menu",async(req,res)=>{
      const result = await menuColl.find().toArray();
      res.send(result); 
    })
    // review coll
    app.get("/reviews",async(req,res)=>{
      const result = await reviewColl.find().toArray();
      res.send(result); 
    })

    // cart coll

    app.get("/carts",async(req,res)=>{
      const email = req.query.email;
      const query = {email:email}
      const result = await cartColl.find(query).toArray();
      res.send(result);
    })

    app.post("/carts",async(req,res)=>{
      const cartItem = req.body;
      const result = await cartColl.insertOne(cartItem);
      res.send(result);
    })

    app.delete("/carts/:id",async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result =  await cartColl.deleteOne(query);
      res.send(result);
    })

    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);



app.get("/",(req,res)=>{
  res.send("Hello world");
})

app.listen(port,()=>{
  console.log('dine pro listening')
})
