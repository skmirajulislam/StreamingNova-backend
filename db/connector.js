const mongoose = require('mongoose');

const connectDB = async () => {
    try{
        connectionTodb = await mongoose.connect(`${process.env.DB_URI}/${process.env.DATABASE_NAME}`);
        console.log(`MongoDB connection succeeded : ${connectionTodb.connection.host}`);
    }catch(error){
        console.log(`MongoDB connection Error : ${error}`);
        process.exit(1);
    }
}

module.exports = connectDB;