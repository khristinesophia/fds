function generateOTP() {
    // Generate a random 6-digit number
    const code = Math.floor(100000 + Math.random() * 900000);

    return code.toString(); // Convert the number to a string
  }

  module.exports = generateOTP