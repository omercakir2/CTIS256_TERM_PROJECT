import "dotenv/config";
import express from "express";
import bcrypt from "bcryptjs";
import db from "./db.js";
import session from "express-session";
import { body, validationResult } from "express-validator";
import multer from "multer";
import path from "path";
import fs from "fs";
import nodemailer from 'nodemailer';




const app = express();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS       
  }
});


app.use(
  session({
    secret: process.env.SESSION_SECRET,
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

const profileValidation = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name cannot be empty.")
    .isLength({ max: 20 }).withMessage("Name cannot be longer than 20 characters."),

  body("city")
    .trim()
    .notEmpty().withMessage("City cannot be empty.")
    .isLength({ max: 20 }).withMessage("City cannot be longer than 20 characters."),

  body("district")
    .trim()
    .notEmpty().withMessage("District cannot be empty.")
    .isLength({ max: 20 }).withMessage("District cannot be longer than 20 characters."),
];

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.json());
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
app.use("/main", checkAuth);
app.use("/market", restrictToRole("market"));
app.use("/main", restrictToRole("consumer"));
app.use("/cart", restrictToRole("consumer"));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads"), 
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `product-${Date.now()}${ext}`); // example: product-1678901234.jpg
  }
});

const upload = multer({ storage });


app.use("/consumer", checkAuth);
app.use("/consumer", restrictToRole("consumer"));

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
      if (user.is_verified === 0) {
        const verificationCode = Math.floor(100000 + Math.random() * 900000);
        
        req.session.pendingVerification = {
            userId: user.id,
            code: verificationCode,
            tempUser: { 
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                city: user.city, 
                 district: user.district 
            }
        };

        await transporter.sendMail({
            from: '"Sustainable Market" <no-reply@susmarket.com>',
            to: user.email,
            subject: "Your 2FA Verification Code",
            text: `Your verification code is: ${verificationCode}`,
            html: `<b>Your verification code is: ${verificationCode}</b>`
        });

        return res.redirect("/verify-2fa");
    }




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
      "INSERT INTO users (email, password, role, name, city, district, is_verified) VALUES (?, ?, ?, ?, ?, ?, 0)",
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


app.get("/verify-2fa", (req, res) => {
    if (!req.session.pendingVerification) return res.redirect("/login");
    res.render("verify", { error: null }); 
});


app.post("/verify-2fa", async (req, res) => {
    const { code } = req.body;
    const pending = req.session.pendingVerification;

    if (!pending) return res.redirect("/login");

    if (parseInt(code) === pending.code) {

        await db.query("UPDATE users SET is_verified = 1 WHERE id = ?", [pending.userId]);


        req.session.user = pending.tempUser;
        delete req.session.pendingVerification; 

        return res.redirect(req.session.user.role === "consumer" ? "/main" : "/market/dashboard");
    } else {
        res.render("verify", { error: "Invalid code! Please check your email." });
    }
});












app.get("/consumer/profile", (req, res) => {
  res.render("profile", {
    user: req.session.user,
    formData: req.session.user,
    error: null,
    success: null,
  });
});

app.post("/consumer/profile", profileValidation, async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.render("profile", {
      user: req.session.user,
      formData: req.body,
      error: errors.array()[0].msg,
      success: null,
    });
  }

  try {
    const { name, city, district } = req.body;
    const userId = req.session.user.id;

    await db.query(
      "UPDATE users SET name = ?, city = ?, district = ? WHERE id = ? AND role = 'consumer'",
      [name.trim(), city.trim(), district.trim(), userId]
    );

    req.session.user.name = name.trim();
    req.session.user.city = city.trim();
    req.session.user.district = district.trim();

    res.render("profile", {
      user: req.session.user,
      formData: req.session.user,
      error: null,
      success: "Profile updated successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Profile update failed.");
  }
});

app.get("/market/profile", (req, res) => {
  res.render("profile", {
    user: req.session.user,
    formData: req.session.user,
    error: null,
    success: null,
  });
});

app.post("/market/profile", profileValidation, async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.render("profile", {
      user: req.session.user,
      formData: req.body,
      error: errors.array()[0].msg,
      success: null,
    });
  }

  try {
    const { name, city, district } = req.body;
    const userId = req.session.user.id;

    await db.query(
      "UPDATE users SET name = ?, city = ?, district = ? WHERE id = ? AND role = 'market'",
      [name.trim(), city.trim(), district.trim(), userId]
    );

    req.session.user.name = name.trim();
    req.session.user.city = city.trim();
    req.session.user.district = district.trim();

    res.render("profile", {
      user: req.session.user,
      formData: req.session.user,
      error: null,
      success: "Profile updated successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Profile update failed.");
  }
});

app.get("/main", async (req, res) => {
  try {
    // 1. Ürünleri çekiyoruz ve tüketicinin şehir ve ilçesine göre sıralıyoruz (önce aynı ilçedeki ürünler, sonra diğerleri)
    const consumerCity = req.session.user.city;
    const consumerDistrict = req.session.user.district;
    const keyword = req.query.keyword || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const offset = (page - 1) * limit;

const [modifiedProducts] = await db.query(
  `SELECT 
      p.id,
      p.title,
      p.stock,
      p.normal_price,
      p.discounted_price,
      p.expiration_date,
      p.image_url,
      u.name AS market,
      u.city AS city,
      u.district AS district
   FROM products p
   JOIN users u ON p.market_id = u.id
   WHERE u.role = 'market'
     AND u.city = ?
     AND p.expiration_date >= CURDATE()
     AND p.title LIKE ?
      ORDER BY 
     CASE 
       WHEN u.district = ? THEN 0
       ELSE 1
     END,
     p.expiration_date ASC
     LIMIT ? OFFSET ?`,
  [consumerCity, `%${keyword}%`, consumerDistrict, limit, offset]
);

const [countRows] = await db.query(
  `SELECT COUNT(*) AS total
   FROM products p
   JOIN users u ON p.market_id = u.id
   WHERE u.role = 'market'
     AND u.city = ?
     AND p.expiration_date >= CURDATE()
     AND p.title LIKE ?`,
  [consumerCity, `%${keyword}%`]
);

const productsWithDetails = modifiedProducts.map((product) => {
  const expirationDate = new Date(product.expiration_date);
  const today = new Date();

  today.setHours(0, 0, 0, 0);
  expirationDate.setHours(0, 0, 0, 0);

  const diffTime = expirationDate - today;
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const formattedExpirationDate = expirationDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return {
    ...product,
    daysLeft,
    formattedExpirationDate,
    isSameDistrict: product.district === req.session.user.district,
  };
});

const totalProducts = countRows[0].total;
const totalPages = Math.ceil(totalProducts / limit);

    res.render("consumerPage", {
      user: req.session.user,
      products: productsWithDetails,
      keyword: keyword,
      currentPage: page,
      totalPages: totalPages
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Bir hata oluştu.");
  }
});

app.get("/product/:id", restrictToRole("consumer"), async (req, res) => {
  try {
    const productId = req.params.id;
    const consumerCity = req.session.user.city;

    const [rows] = await db.query(
      `SELECT 
          p.id,
          p.title,
          p.stock,
          p.normal_price,
          p.discounted_price,
          p.expiration_date,
          p.image_url,
          u.name AS market,
          u.city AS city,
          u.district AS district
       FROM products p
       JOIN users u ON p.market_id = u.id
       WHERE p.id = ?
         AND u.role = 'market'
         AND u.city = ?
         AND p.expiration_date >= CURDATE()`,
      [productId, consumerCity]
    );

    if (rows.length === 0) {
      return res.status(404).send("Product not found.");
    }

    const product = rows[0];

    const expirationDate = new Date(product.expiration_date);
    const today = new Date();

    today.setHours(0, 0, 0, 0);
    expirationDate.setHours(0, 0, 0, 0);

    const diffTime = expirationDate - today;
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    product.daysLeft = daysLeft;
    product.formattedExpirationDate = expirationDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    product.isSameDistrict = product.district === req.session.user.district;

    res.render("product-detail", {
      user: req.session.user,
      product,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Product detail page failed.");
  }
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
    const [rowsProduct] = await db.query("select * from products where id = ? ",[productId]);


    if(rowsProduct.length > 0 && rowsProduct[0].stock > 0 ){//means product exits and there is enough stock 
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
      await db.query("update products set stock=? where id=?",[rowsProduct[0].stock-1,productId]);
    }

    const backURL = req.get('Referrer') || '/'; 
    res.redirect(backURL);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error Occurred!");
  }
});
app.post("/cart/update-quantity", async (req, res) => {
  try {
    const { cartId, action } = req.body;
    const consumerId = req.session.user.id;

    const [rows] = await db.query(
      "SELECT * FROM carts WHERE id = ? AND consumer_id = ?",
      [cartId, consumerId]
    );
    const [rowsProduct] = await db.query("select * from products where id = ? ",[rows[0].product_id]);

    if (rows.length === 0 && rowsProduct.length === 0) return res.status(404).json({ success: false });

    let newQuantity = rows[0].quantity;
    if (action === "increment") {
      if(rowsProduct.length > 0 && rowsProduct[0].stock > 0 ){
        newQuantity++;
        await db.query("update products set stock=? where id=?",[rowsProduct[0].stock-1,rows[0].product_id]);
      }
    } else if (action === "decrement" && newQuantity > 1) {
      newQuantity--;
      await db.query("update products set stock=? where id=?",[rowsProduct[0].stock+1,rows[0].product_id]);
    } else if (action === "decrement" && newQuantity === 1) {
      return res.json({ success: true, newQuantity: 1 });
    }

    await db.query("UPDATE carts SET quantity = ? WHERE id = ?", [
      newQuantity,
      cartId,
    ]);

    res.json({ success: true, newQuantity: newQuantity });
  } catch (err) {
    console.log(err);

    res.status(500).json({ success: false });
  }
});
app.delete("/cart/remove/item/:id", async (req, res) => {
  try {
    const consumerId = req.session.user.id;
    const cart_id = req.params.id;

    const [rows] = await db.query(
      "SELECT * FROM carts WHERE id = ? AND consumer_id = ?",
      [cart_id, consumerId]
    );
    const quantity = rows[0].quantity;

    const [rowsProduct] = await db.query("select * from products where id = ? ",[rows[0].product_id]);

    const [result] = await db.query(
      "DELETE FROM carts WHERE id = ? AND consumer_id = ?",
      [cart_id, consumerId]
    );
    if (result.affectedRows > 0) {
      await db.query("update products set stock=? where id=?",[rowsProduct[0].stock + quantity ,rows[0].product_id]);
      res.json({ success: true, message: "Ürün sepetten silindi." });
    } else {
      res.status(404).json({ success: false, message: "Ürün bulunamadı." });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error Occurred!");
  }
});
app.delete("/cart/clear", async (req, res) => {
  //clears the currently logged in user's cart
  try {
    const consumer_id = req.session.user.id || 0;
    const [rows] = await db.query("delete from carts where consumer_id=?", [
      consumer_id,
    ]);
    if (rows.affectedRows > 0) {
      //delete success
      res.status(200).json({ success: true, message: "cart cleared!" });
    } else {
        res.status(404).json({ success: false, message: "cart is already EMPTY!" });
    }
  } catch (error) {
    console.log(error);
  }
});

app.get("/market/dashboard", async (req, res) => {
  const market_id = req.session.user.id;
  const [ rowsM ] = await db.query(`SELECT * FROM users where id = ?`, [market_id]);
  const [rows] = await db.query("SELECT * FROM products where market_id = ? ",[market_id]);

  if (rowsM.length === 0) return res.status(404).send("cannot find market user");

  // if (rows.length === 0) return res.status(404).send("product does not exist.");

  let totalstock=0;
  let totalproduct=0;
  let activeproduct=0;
  let expiredproduct=0;
  const today = new Date();
  rows.forEach(e => {
    if(e.expiration_date < today ){
      //expired
      expiredproduct++
      e.isActive= false;
    }else{
      activeproduct++
      e.isActive= true;
    }
    totalstock+=e.stock;
    totalproduct++;
  })

  res.render("dashboard", { product : rows , market : rowsM[0],totalstock,totalproduct,activeproduct,expiredproduct });
});

app.get("/market/addproduct", async (req, res) => {
  const market_id = req.session.user.id;
  const [rowsM] = await db.query(`SELECT * FROM users where id = ?`, [market_id]);

  if (rowsM.length === 0) return res.status(404).send("cannot find market user");

  const infoMsg = req.session.infoMessage ?? "";
  const infoMsgStatus = req.session.infStatus ?? 0;
  delete req.session.infoMessage;
  delete req.session.infStatus;

  res.render("addproduct", { market : rowsM[0], infoMsg, infoMsgStatus});
});
app.get("/market/product/edit/:proid", async (req, res) => {
  const productId = parseInt(req.params.proid);
  const [rows] = await db.query("SELECT * FROM products WHERE id = ?", [productId]);
  const market_id = req.session.user.id;
  const [rowsM] = await db.query(`SELECT * FROM users where id = ?`, [market_id]);

  if (rowsM.length === 0) return res.status(404).send("cannot find market user");

    if (rows.length === 0) {
      return res.status(404).send("product does not exist.");
    }

  const infoMsg = req.session.infoMessage ?? "";
  const infoMsgStatus = req.session.infStatus ?? 0;
  delete req.session.infoMessage;
  delete req.session.infStatus;

  res.render("editproduct", { product : rows[0], market : rowsM[0], infoMsg, infoMsgStatus});
});

app.post("/market/addproduct", upload.single("product_image"), async (req,res) => {
  //const original_p= Number(original_price) no need

  try {
    const {product_title, product_stock, original_price, 
            discounted_price, expire_date} = req.body;
    const marketId = req.session.user.id;
    const imageFilename = req.file.filename;

    await db.query(`INSERT INTO products(market_id,title,stock,normal_price,
                    discounted_price,expiration_date,image_url) VALUES(?,?,?,?,?,?,?)`,
                  [marketId, product_title, product_stock, original_price,
                    discounted_price, expire_date, imageFilename])

    req.session.infStatus= true; 
    req.session.infoMessage = "Product added successfully!"; 
             
    req.session.save((err) => {
      res.redirect("/market/addproduct");
    });

    } catch (err) {
      console.log(err)
      req.session.infStatus= false; 
      req.session.infoMessage = "Product CANNOT added! Check product informations.";

      req.session.save((err) => {
      res.redirect("/market/addproduct");
    });

    }
});

app.post("/market/editproduct/:proid", upload.single("product_image"), async (req,res) => {
  try {
    const productId = parseInt(req.params.proid);
    const {product_title, product_stock, original_price, 
            discounted_price, expire_date, product_image_already} = req.body;
    let imageFilename= product_image_already;
    const marketId = req.session.user.id;

    if (req.file) {
    imageFilename = req.file.filename;

  
    if (product_image_already) {
       const oldPath = path.join(process.cwd(), "public", "uploads", product_image_already);
       if (fs.existsSync(oldPath)) {
           fs.unlinkSync(oldPath);
       }
    }
  }

    await db.query(`UPDATE products SET title = ?, stock = ?, normal_price = ?,
                    discounted_price = ?, expiration_date = ?, image_url = ? 
                    WHERE id = ?`,
                  [product_title, product_stock, original_price, 
                   discounted_price, expire_date, imageFilename,
                   productId
                  ]);
      
    req.session.infStatus = true; 
    req.session.infoMessage = "Product updated successfully!"; 
             
    req.session.save((err) => {
      res.redirect("/market/product/edit/"+ productId);
    });
    } catch (err) {
      console.log(err);
      req.session.infStatus = false; 
      req.session.infoMessage = "Product CANNOT be updated! Check product informations.";

      req.session.save((err) => {
        res.redirect("/market/product/edit/"+ productId);
      });
    }
});

app.get("/market/product/delete/:proid", async (req,res) => {
  try {
    const productId = parseInt(req.params.proid);
    const [rows] = await db.query("SELECT image_url FROM products WHERE id = ?", [productId]);

    if (rows.length === 0) {
      return res.status(404).send("product does not exist.");
    }

    const imageFilename = rows[0].image_url;

    if (imageFilename) {
      const filePath = path.join(process.cwd(), "public", "uploads", imageFilename);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // Dosyayı silen komut
        console.log("image was deleted properly.", imageFilename);
      }
    }

    await db.query("DELETE FROM products WHERE id = ?", [productId]);
    res.redirect("/market/dashboard");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${process.env.APP_PORT}`);
});
