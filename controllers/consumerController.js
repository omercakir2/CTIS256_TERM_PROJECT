import db from "../db.js";

export const getMain = async (req, res) => {
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
};

export const getProductDetail = async (req, res) => {
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
};