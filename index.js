const express = require('express')
const cors = require('cors');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

//mongodb
// geniusdbUser
// 25v8Pv4vuo3FIDi9


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ksaovkw.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({ massage: 'Unauthorized access denied' });
  };
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(401).send({ massage: 'Unauthorized access denied' });
    }
    req.decoded = decoded;
    next();

  })
}


async function run() {
  try {
    const userCollection = client.db('my-genius-car').collection('services');
    const OrdersCollection = client.db('my-genius-car').collection('orders');

    app.post('/jwt', (req, res) => {
      const user = req.body
      const token = jwt.sign(user, process.env.ACCESS_SECRET_TOKEN, { expiresIn: '1h' })
      res.send({ token })
    });



    app.get('/services', async (req, res) => {
      const query = {};
      const services = await userCollection.find(query).toArray();
      res.send(services);
    });

    app.get('/services/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await userCollection.findOne(query);
      res.send(service);
    })


    // orders api


    app.get('/orders', verifyJWT, async (req, res) => {
      const decoded = req.decoded;
      console.log(decoded);
      if (decoded.email !== req.query.email) {
        res.status(403).send({ massage: 'Unauthorized access denied' });
      }

      let query = {};
      if (req.query.email) {
        query = {
          email: req.query.email
        }
      }
      const result = await OrdersCollection.find(query).toArray();
      res.send(result);

    });

    app.post('/orders', async (req, res) => {
      const order = req.body;
      const result = await OrdersCollection.insertOne(order);
      res.send(result);
    })

    app.patch('/orders/:id', async (req, res) => {
      const id = req.params.id;
      const status = req.body.status;
      const query = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: status
        }
      }
      const result = await OrdersCollection.updateOne(query, updatedDoc);
      res.send(result);

    })
    app.delete('/orders/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await OrdersCollection.deleteOne(query);
      // console.log(result);
    })

  }


  finally {
    // client.close();
  }


}
run().catch(err => console.error(err));










app.get('/', (req, res) => {
  res.send('Genius car server running!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})