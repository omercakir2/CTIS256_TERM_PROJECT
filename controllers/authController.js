import bcrypt from "bcryptjs";
import { validationResult } from "express-validator";
import db from "../db.js";
import transporter from "../config/mailer.js";

export const getLogin = (req, res) => {
  if (req.session.user) {
    return res.redirect(
      req.session.user.role === "consumer" ? "/main" : "/market/dashboard"
    );
  }
  res.render("login", { error: null, formData: {} });
};

export const postLogin = async (req, res) => {
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
};

export const getLogout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect("/main");
    }
    res.clearCookie("connect.sid");
    res.redirect("/login");
  });
};

export const getRegister = (req, res) => {
  res.render("register", { error: null, formData: {} });
};

export const postRegister = async (req, res) => {
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
};

export const getVerify2FA = (req, res) => {
    if (!req.session.pendingVerification) return res.redirect("/login");
    res.render("verify", { error: null }); 
};

export const postVerify2FA = async (req, res) => {
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
};