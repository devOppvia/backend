function isValidPassword(password) {
  const passwordRegex =
    /^(?!.*\s)(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_]).{6,64}$/;
  return passwordRegex.test(password);
}


module.exports = isValidPassword;
