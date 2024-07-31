const { default: axios } = require("axios");
const userModel = require("../model/authModel");
const db = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();

const SECRET_KEY = "gusdmswldnqldks";
const SALT_ROUNDS = 10;

exports.logUser = async (req, res) => {
  const user = await userModel.getAllUser();

  res.status(200).json({
    user,
  });
};

exports.kakaoLogin = async (req, res) => {
  console.log(req.body);

  const { accessToken, refreshToken } = req.body;

  try {
    const kakaoResponse = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const kakaoUser = kakaoResponse.data;

    console.log("🔥 kakao user", kakaoUser);

    const { id, properties, kakao_account } = kakaoUser;

    const [results] = await db.query("SELECT * FROM users WHERE kakao_id = ?", [id]);

    if (results.length > 0) {
      const user = results[0];

      console.log("useruser", user);

      const newAccessToken = jwt.sign({ user_id: user.user_id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
      const newRefreshToken = jwt.sign({ user_id: user.user_id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

      const profile_image = properties.profile_image;
      res.json({
        CODE: "KL000",
        message: "Login successful",
        TOKEN: { accessToken: newAccessToken, refreshToken: newRefreshToken },
        DATA: { info: { user_id: user.user_id, createdAt: user.createdAt, profile_image: profile_image } },
      });

      console.log("success!!!");
    } else {
      const username = properties.nickname;
      const profile_image = properties.profile_image;

      const [insertResult] = await db.query("INSERT INTO users (kakao_id, nickname, profile_image, createdAt, type) VALUES (?, ?, ?, ?, ?)", [id, username, profile_image, new Date(), 2]);

      console.log("rrr", insertResult);

      const userId = insertResult.insertId;

      const newAccessToken = jwt.sign({ user_id: userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
      const newRefreshToken = jwt.sign({ user_id: userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

      console.log("🔥🔥🔥🔥🔥🔥🔥🔥", userId, newAccessToken, newRefreshToken);

      res.json({
        CODE: "KRL000",
        message: "Signup and login successful",
        TOKEN: { accessToken: newAccessToken, refreshToken: newRefreshToken },
        DATA: { info: { user_id: userId, createdAt: new Date(), profile_image: profile_image } },
      });

      console.log("success!!!");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ CODE: "ERROR", message: "Internal server error", error: err.message });
  }
};

exports.login = async (req, res) => {
  const { id, password } = req.body;

  if (!id || !password) {
    console.log("🔥🔥");
    return res.json({ CODE: "AL001", message: "Missing required fields" });
  }
  console.log("🔥🔥🔥🔥");

  // res.json({ message: "그만 좀 보내!!!!!" });

  try {
    const [results] = await db.query("SELECT * FROM users WHERE userId = ?", [id]);

    if (results.length === 0) {
      console.log("results", results);
      return res.json({ CODE: "AL002", message: "Invalid username or password" });
    }

    const user = results[0];
    console.log(results);
    console.log(password, user.password);
    const isMatch = await bcrypt.compare(password, user.password);

    console.log("isMatch", isMatch);

    if (!isMatch) {
      return res.json({ CODE: "AL002", message: "Invalid username or password" });
    }

    console.log("user1", user);

    const accessToken = jwt.sign({ user_id: user.user_id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
    const refreshToken = jwt.sign({ user_id: user.user_id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

    console.log("🔥🔥🔥🔥🔥🔥🔥🔥", user, accessToken, refreshToken);

    res.json({ CODE: "AL000", message: "Login successful", TOKEN: { accessToken, refreshToken }, DATA: { info: { user_id: user.user_id, createdAt: user.createdAt } } });
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
};

exports.register = async (req, res) => {
  const { id, password } = req.body;

  console.log(req.body);

  if (!id || !password) {
    return res.json({ CODE: "AR001", message: "Missin required fields" });
  }

  try {
    const [result] = await db.query("select * from users where userId = ?", [id]);

    console.log("🔥", result);
    if (result.length > 0) {
      return res.json({ CODE: "AR002", message: "not available" });
    } else {
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      db.query("insert into users (userId, password, createdAt, type) values (?,?,?, ?)", [id, hashedPassword, new Date(), 1], (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res.json({ CODE: "AR003", message: "ID already exists" });
          }

          console.error(err);
          return res.sendStatus(500);
        }
      });
      res.json({ CODE: "AR000", message: "User registered successfully" });
    }
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

exports.check = async (req, res) => {
  const { newAccessToken } = req;
  res.json({ CODE: "AC000", message: "success", DATA: { accessToken: newAccessToken } });
};

exports.refresh = async (req, res) => {
  const refreshToken = req.headers.refresh;

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.json({ CODE: "ART001", message: "refreshtoken invalid" });

    const payload = {
      ...user,
      exp: Math.floor(Date.now() / 1000) + 60 * 10, // 1분 후 만료
    };

    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET);
    res.json({ CODE: "ART000", message: "refresh successful", TOKEN: { accessToken } });
  });
};

// exports.info = async (req, res) => {
//   console.log("ksdmfksdmfk", req.headers.authorization);
//   const token = await req.headers.authorization.split(" ")[1];
//   console.log("Token:", token);

//   const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
//   console.log("Decoded JWT:", decoded);
//   const userId = decoded.id;
//   console.log("User ID:", userId);

//   try {

//   } catch (error) {
//     console.error("JWT Verification Error:", error);
//     return res.json({ CODE: "AI003", MESSAGE: "Invalid token" });
//   }
// };
exports.info = async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  console.log("Token:", token);

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log("Decoded Token:", decodedToken);

    if (!decodedToken || !decodedToken.user_id) {
      return res.json({ CODE: "AI001", MESSAGE: "Invalid token111" });
    }

    const userId = decodedToken.user_id;
    console.log("User ID:", userId);

    const info = await userModel.getUserInfo(userId);

    console.log("info", info);

    res.json({ CODE: "AI000", DATA: info });
  } catch (error) {
    console.error("JWT Verification Error:", error);
    return res.json({ CODE: "AI003", MESSAGE: "Invalid token" });
  }
};
