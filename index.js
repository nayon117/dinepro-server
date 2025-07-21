const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
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

    
    // jwt 
    app.post("/jwt", async(req,res)=>{
      const user = req.body;
      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET, {expiresIn:'6h'});
      res.send({token});
    })

    // middlewares
    const verifyToken = (req,res,next) =>{
      console.log('inside verify token',req.headers.authorization);
      if(!req.headers.authorization) {
        return res.status(401).send({message: 'unAuthorized access'});
      }

      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token,process.env.ACCESS_TOKEN_SECRET, (err,decoded)=>{
        if(err) { 
          return res.status(401).send({message: 'unAuthorized access'});
        }
        req.decoded = decoded
        next();
      })
    }

    // verify admin
    const verifyAdmin = async (req,res,next) =>{
      const email = req.decoded.email;
      const query = {email: email};
      const user = await userColl.find(query);
      const isAdmin = user?.role === "admin";
      if(!isAdmin) {
        return res.status(403).send({message:"forbidden access"});
      }
      next();
    }

    // user collection
    app.get("/users", verifyToken, verifyAdmin, async(req,res)=>{
      const result = await userColl.find().toArray();
      res.send(result);
    })

    // check admin
    app.get("/users/admin/:email", verifyToken, async(req,res)=>{
      const email = req.params.email;
      if(email != req.decoded.email) {
        return res.status(403).send({message: 'forbidden access'});
      }
      const query = {email: email}
      const user = await userColl.findOne(query);
      let admin = false;
      if(user) {
        admin = user?.role === "admin"
      }
      res.send({admin});
    })

    app.post("/users",async(req,res)=>{
      const user = req.body;
      const query = {email:user.email}
      const existingUser = await userColl.findOne(query);
      if(existingUser) return res.send({message:'user already exist'})
      const result = await userColl.insertOne(user);
      res.send(result);
    })

    app.patch("/users/admin/:id", verifyToken,verifyAdmin, async(req,res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const updatedDoc = {
        $set: { role : 'admin' }
      };
      const result = await userColl.updateOne(filter,updatedDoc);
      res.send(result);
    })

    app.delete("/users/:id", verifyToken,verifyAdmin, async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await userColl.deleteOne(query);
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
