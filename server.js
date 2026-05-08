import "dotenv/config";
import express from "express";
import session from "express-session";

import { checkAuth, restrictToRole } from "./middleware/auth.js";
import authRoutes from "./routes/authRoutes.js";
import consumerRoutes from "./routes/consumerRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import marketRoutes from "./routes/marketRoutes.js";

const app = express();

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route-level auth guards
app.use("/market", checkAuth);
app.use("/main", checkAuth);
app.use("/market", restrictToRole("market"));
app.use("/main", restrictToRole("consumer"));
app.use("/cart", restrictToRole("consumer"));
app.use("/consumer", checkAuth);
app.use("/consumer", restrictToRole("consumer"));

// Index
app.get("/", (req, res) => {
  res.render("index");
});

// Routes
app.use("/", authRoutes);
app.use("/", consumerRoutes);
app.use("/cart", cartRoutes);
app.use("/market", marketRoutes);

const PORT = process.env.APP_PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${process.env.APP_PORT}`);
});