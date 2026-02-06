import dotenv from "dotenv"
dotenv.config()
import connectDB from "./db/index.js"
import { app } from "./app.js"

connectDB()

    .then(() => {
        try {
            app.listen(process.env.PORT || 8000, () => {
                console.log(`Server is running at port ${process.env.PORT}`);
            })
        } catch (error) {
            app.on("error", (error) => {
                console.log("Error: ", error);
                throw error
            })
        }
    })
    .catch((err) => {
        console.log("MONGO DB connection failed", err);
    })