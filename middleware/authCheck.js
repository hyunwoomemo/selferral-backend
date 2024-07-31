const jwt = require("jsonwebtoken");

exports.authCheck = (req, res, next) => {
  if (!req.headers["authorization"]) return;
  const token = req.headers["authorization"].split(" ")[1];

  console.log("token 123123", token);

  if (token == null) return res.json({ CODE: "AC001", message: "access token invalid" });

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    console.log("user", user);
    if (err) {
      if (err.name === "TokenExpiredError") {
        const refreshToken = req.headers.refresh;

        if (refreshToken == null) return res.json({ CODE: "AC001", message: "token invalid" });

        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
          console.log("refreshToken", token, refreshToken, err);
          if (err) return res.json({ CODE: "AC001", message: "refresh token invalid" });
          console.log("useruseruser", user);
          const payload = {
            ...user,
            exp: Math.floor(Date.now() / 1000) + 60 * 1, // 1분 후 만료
          };

          const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET);
          req.user = user;
          req.headers.authorization = `Bearer ${accessToken}`;
          next();
        });
      }

      // return res.json({ CODE: "AC001", message: "acess token invalid" });
    } else {
      next();
    }
  });
};
