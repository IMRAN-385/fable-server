require("dotenv").config();

console.log("ENV TEST:", process.env.MONGO_URI);

const app = require("./src/app");
const connectDB = require("./src/config/db");

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});