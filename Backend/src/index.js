import app from "./app.js";
import dotenv from "dotenv";
import connectDB from "./db/db.js";

dotenv.config({
  path: "./.env",
});

const PORT = process.env.PORT || 8000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is connected at port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection Error ", err);
    process.exit(1);
  });


