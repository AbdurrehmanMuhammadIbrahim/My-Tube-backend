

import connectDB from "./db/index.js";
import  dotenv  from "dotenv"
import app from './app.js'


dotenv.config({ path: './.env' });  

const PORT = process.env.PORT

connectDB()
.then(()=>{
    app.listen(PORT || 8000, ()=> {
console.log(`Server is running on port ${PORT}`)
    })
})

.catch((error)=>{
    console.log("Server failed to start", error)
    process.exit(1)
})