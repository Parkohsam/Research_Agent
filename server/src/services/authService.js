const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const registerUser = async ({ name, email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    throw new Error("A user with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
  });

  const token = jwt.sign(
    {
      userId: user._id.toString(),
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  return {
    token,
    user,
  };
};

const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  console.log("Login attempt:", {
    email: normalizedEmail,
    passwordReceived: Boolean(password),
  });

  const user = await User.findOne({
    email: normalizedEmail,
  });

  console.log("User found:", Boolean(user));

  if (!user) {
    throw new Error("Invalid email or password");
  }

  console.log(
    "Stored password starts with:",
    user.password.substring(0, 4)
  );

  const isPasswordCorrect = await bcrypt.compare(
    password,
    user.password
  );

  console.log("Password correct:", isPasswordCorrect);

  if (!isPasswordCorrect) {
    throw new Error("Invalid email or password");
  }

  const token = jwt.sign(
    {
      userId: user._id.toString(),
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  return {
    token,
    user,
  };
};

module.exports = {
  registerUser,
  loginUser,
};