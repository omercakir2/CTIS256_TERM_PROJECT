import db from "../db.js";

export const getCart = async (req, res) => {
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
};

export const addToCart = async (req, res) => {
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
};

export const updateCartQuantity = async (req, res) => {
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
};

export const removeCartItem = async (req, res) => {
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
};

export const clearCart = async (req, res) => {
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
};