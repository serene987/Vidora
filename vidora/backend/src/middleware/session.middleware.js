const authenticate = (req, res, next) => {
  console.log('🔐 SESSION AUTH: Checking session...', {
    sessionExists: !!req.session,
    userExists: !!req.session?.user,
    sessionId: req.session?.id
  });
  
  if (!req.session.user) {
    console.log('❌ SESSION AUTH: No user in session');
    return res.status(401).json({ message: 'Not logged in' });
  }
  
  req.user = req.session.user;
  console.log('✅ SESSION AUTH: User authenticated:', { id: req.user.id, email: req.user.email });
  next();
};

module.exports = {
  authenticate
};