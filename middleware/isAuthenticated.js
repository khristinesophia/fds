const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
      return next();
    }
    // res.redirect('/login');  // Redirect to login if not authenticated
  };
  
module.exports = isAuthenticated;