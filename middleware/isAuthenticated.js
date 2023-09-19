const isAuthenticated = (req, res, next) => {
    if (req.session.userID) {
      return next();
    }
    res.redirect('/');  // Redirect to landing if not authenticated
  };
  
module.exports = isAuthenticated;