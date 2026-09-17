const jwt = require("jsonwebtoken");
const User = require("../models/user");

const getAuthenticatedUser = async (authorizationHeader) => {
  if (!authorizationHeader) {
    return null;
  }

  const token = authorizationHeader.replace("Bearer ", "");

  try {
    const decodedToken = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(decodedToken.userId);

    return user;
  } catch (error) {
    return null;
  }
};

module.exports = {
  getAuthenticatedUser,
};