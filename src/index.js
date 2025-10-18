import dotenv from "dotenv"
import connectDB from "./db/index.js"
import { app } from "./app.js"

dotenv.config({
    path: "./env"
})

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