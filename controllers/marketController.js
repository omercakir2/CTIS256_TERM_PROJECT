import path from "path";
import fs from "fs";
import db from "../db.js";

export const getDashboard = async (req, res) => {
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
};

export const getAddProduct = async (req, res) => {
  const market_id = req.session.user.id;
  const [rowsM] = await db.query(`SELECT * FROM users where id = ?`, [market_id]);

  if (rowsM.length === 0) return res.status(404).send("cannot find market user");

  const infoMsg = req.session.infoMessage ?? "";
  const infoMsgStatus = req.session.infStatus ?? 0;
  delete req.session.infoMessage;
  delete req.session.infStatus;

  res.render("addproduct", { market : rowsM[0], infoMsg, infoMsgStatus});
};

export const getEditProduct = async (req, res) => {
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
};

export const postAddProduct = async (req, res) => {
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
};

export const postEditProduct = async (req, res) => {
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
};

export const deleteProduct = async (req, res) => {
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
};