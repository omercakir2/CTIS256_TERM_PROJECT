import { validationResult } from "express-validator";
import db from "../db.js";

export const getConsumerProfile = (req, res) => {
  res.render("profile", {
    user: req.session.user,
    formData: req.session.user,
    error: null,
    success: null,
  });
};

export const postConsumerProfile = async (req, res) => {
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
};

export const getMarketProfile = (req, res) => {
  res.render("profile", {
    user: req.session.user,
    formData: req.session.user,
    error: null,
    success: null,
  });
};

export const postMarketProfile = async (req, res) => {
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
};