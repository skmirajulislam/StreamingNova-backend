const cookieParser = require('cookie-parser');
const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();


/* 16 kb data trasfer possible */
app.use(express.json({ limit: '16kb' })) // For Accepting Request Object as Json of 16kb
app.use(express.urlencoded({ limit: '16kb', extended: true })) // For accepting Request Object as strings or arrays of 16kb
app.use(cookieParser()) // for Performing operations on browser cookie.


/* for cross origin Resource sharing connection and proxy */
app.use(cors({ origin: process.env.ORIGIN }));

/* Serving static resourses on server for UI page */
app.use(express.static('Public'));

/* for database connectivity */
async function connection() {
    const connectDB = require('./db/connector');
    connectDB();
} 
connection()

/* All module Imports for MiddleWare routes */
const userRouter = require('./Routes/user.routes');

/* Middleware & routes {http://localhost:8000/api/v1/users/controller_Route_name} */
app.use('/api/v1/users',userRouter);


/* Default Route For Express Sarver */
app.get('/', (req, res) => {
    res.send('Hello World!')
});



/* Express server Listener */
app.listen(process.env.PORT || 3001, () => {
    console.log(`Express app listening on port http://localhost:${process.env.PORT}`);
});
