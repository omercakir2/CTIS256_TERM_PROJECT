import "dotenv/config";
import express from "express";
import bcrypt from "bcryptjs";
import db from "./db.js";
import session from "express-session";
import { body, validationResult } from "express-validator";

const app = express();

app.use(
  session({
    secret: "secretkey",
    resave: false,
    saveUninitialized: false,
  })
);

const registerValidation = [
  body("email").isEmail().withMessage("Invalid email format!"),
  body("password").notEmpty().withMessage("Password cannot be empty."),
  body("name").notEmpty().withMessage("Name cannot be empty"),
  body("city").notEmpty().withMessage("City cannot be empty"),
  body("district").notEmpty().withMessage("District cannot be empty"),
];

const loginValidation = [
  body("email").isEmail().withMessage("Invalid email format!"),
  body("password").notEmpty().withMessage("Password cannot be empty."),
];

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.APP_PORT || 3000;

// Auth Kontrol Middleware
const checkAuth = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
};
const restrictToRole = (role) => {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.redirect("/login");
    }
    if (role && req.session.user.role !== role) {
      return res.status(403).send("Bu sayfaya erişim yetkiniz yok.");
    }
    next();
  };
};

app.use("/market", checkAuth);
app.use("main", checkAuth);
app.use("/market", restrictToRole("market"));
app.use("/main", restrictToRole("consumer"));
app.use("/cart", restrictToRole("consumer"));

app.get("/", (req, res) => {
  res.render("index");
});
app.get("/login", (req, res) => {
  if (req.session.user) {
    return res.redirect(
      req.session.user.role === "consumer" ? "/main" : "/market/dashboard"
    );
  }
  res.render("login", { error: null, formData: {} });
});
app.post("/login", loginValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render("login", {
      error: errors.array()[0].msg,
      formData: req.body,
    });
  }

  const email = req.body.email.trim();
  const password = req.body.password.trim();

  const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

  if (rows.length > 0) {
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (match) {
      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        city: user.city,
        district: user.district,
      };
      if (user.role === "consumer") {
        res.redirect("/main");
      } else {
        res.redirect("/market/dashboard");
      }
    } else {
      res.render("login", {
        error: "Invalid username or password",
        formData: req.body,
      });
    }
    //     if (password === 'password123' || password === user.password) {
    //     console.log("yess");
    //     return res.redirect("/market/dashboard");
    // } else {
    //     console.log("noo");
    //     return res.redirect("/");
    // }
  } else {
    res.render("login", {
      error: "Invalid username or password",
      formData: req.body,
    });
  }
});
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect("/main");
    }
    res.clearCookie("connect.sid");
    res.redirect("/login");
  });
});
app.get("/register", (req, res) => {
  res.render("register", { error: null, formData: {} });
});
app.post("/register", registerValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render("register", {
      error: errors.array()[0].msg,
      formData: req.body,
    });
  }

  try {
    const { email, password, confirmPassword, role, name, city, district } =
      req.body;

    if (password !== confirmPassword) {
      return res.render("register", {
        error: "passwords dont match",
        formData: req.body,
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password.trim(), saltRounds);

    await db.query(
      "INSERT INTO users (email, password, role, name, city, district, is_verified) VALUES (?, ?, ?, ?, ?, ?, 1)",
      [email.trim(), hashedPassword, role, name, city, district]
    );
    res.redirect("/login");
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.render("register", {
        error: "This email is already registered!",
        formData: req.body,
      });
    }
    res
      .status(500)
      .send("An error occurred during registration. Please try again later.");
  }
});
app.get("/main", async (req, res) => {
  try {
    // 1. Ürünleri çekiyoruz
    const [products] = await db.query("SELECT * FROM products");
    const [markets] = await db.query(
      "SELECT id, name,district FROM users where role='market' "
    );

    const modifiedProducts = products.map((product) => {
      const market = markets.find((m) => m.id === product.market_id);

      return {
        ...product,
        market: market ? market.name : "Unknown Market",
        district: market ? market.district : "Unknown District",
      };
    });

    res.render("consumerPage", {
      user: req.session.user,
      products: modifiedProducts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Bir hata oluştu.");
  }
});
app.get("/market/dashboard", (req, res) => {
  res.render("dashboard");
});
app.get("/market/addproduct", (req, res) => {
  res.render("addproduct");
});
app.get("/market/product/edit", (req, res) => {
  res.render("editproduct");
});
app.get("/cart", async (req, res) => {
  try {
    const consumerId = req.session.user.id;

    const [cartItems] = await db.query(
      `SELECT  
        c.id AS cart_id,
        p.id AS product_id, 
        c.quantity AS quantity, 
        p.title, 
        p.normal_price, 
        p.discounted_price, 
        p.image_url 
        FROM carts c 
        JOIN products p ON c.product_id = p.id 
        WHERE c.consumer_id = ?`,
      [consumerId]
    );

    const totalPrice = cartItems.reduce((sum, item) => {
      const price = item.discounted_price || 0;
      const quantity = item.quantity || 0;
      return sum + price * quantity;
    }, 0);
    console.log(totalPrice);

    res.render("cart", {
      cart: cartItems,
      total: totalPrice.toFixed(2),
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Sepet yüklenirken bir hata oluştu.");
  }
});
app.get("/cart/add/product/:id", async (req, res) => {
  try {
    const consumerId = req.session.user.id;
    const productId = req.params.id;

    const [rows] = await db.query(
      "SELECT * FROM carts WHERE consumer_id = ? AND product_id = ?",
      [consumerId, productId]
    );

    if (rows.length > 0) {
      await db.query("UPDATE carts SET quantity = ? WHERE id = ?", [
        rows[0].quantity + 1,
        rows[0].id,
      ]);
    } else {
      await db.query(
        "INSERT INTO carts (consumer_id, product_id, quantity, added_at) VALUES (?, ?, ?, ?)",
        [consumerId, productId, 1, new Date()]
      );
    }

    res.redirect("/main");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error Occurred!");
  }
});
app.get("/cart/remove/item/:id", async (req, res) => {
  try {
    const consumerId = req.session.user.id;
    const cart_id = req.params.id;

    const [rows] = await db.query("DELETE FROM carts WHERE id = ? ", [cart_id]);
    res.redirect("/cart");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error Occurred!");
  }
});
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${process.env.APP_PORT}`);
});
