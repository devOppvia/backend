function validateEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  return emailRegex.test(email);
}


module.exports = validateEmail;
