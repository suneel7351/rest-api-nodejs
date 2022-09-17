const sendToken = (res, user, message, statusCode = 200) => {
  const token = user.getJWTToken();
  const options = {
    httpOnly: true,
    // secure: true,
    sameSite: true,
    expires: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
  };
  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({ success: true, message, token });
};

export default sendToken;
