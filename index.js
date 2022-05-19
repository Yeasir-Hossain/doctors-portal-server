const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qzr3m.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const serviceCollection = client.db("doctors-portal").collection("services");
        const bookingCollection = client.db("doctors-portal").collection("bookings");



        app.get('/service', async (req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query)
            const services = await cursor.toArray()
            res.send(services)
        })

        app.get('/available', async (req, res) => {
            const date = req.query.date
            //get all services
            const services = await serviceCollection.find().toArray()
            //get booking
            const query = { date: date }
            const bookings = await bookingCollection.find(query).toArray()
            //for each service find bookings of that day
            services.forEach(service => {
                const serviceBookings = bookings.filter(b => b.treatment === service.name);
                const booked = serviceBookings.map(s => s.slot);
                service.slots = service.slots.filter(s=>!booked.includes(s))
            })
            res.send(services)
        })

        //BOOKING

        app.get('/booking',async(req,res)=>{
            const patient = req.query.patient;
            const query = {patient:patient}
            const bookings = await bookingCollection.find(query).toArray()
            res.send(bookings)
        })

        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const query = { treatment: booking.treatment, date: booking.date, patient: booking.patient }
            const exists = await bookingCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, booking: exists })
            }
            const result = await bookingCollection.insertOne(booking);
            res.send({ success: true, result })
        })


    } finally {

    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Doctors portal server running!')
})

app.listen(port, () => {
    console.log(`Doctors portal listening on port ${port}`)
})