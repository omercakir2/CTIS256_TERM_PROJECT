// Auth Kontrol Middleware
export const checkAuth = (req, res, next) => {
    if (req.session.user) {
      next();
    } else {
      res.redirect("/login");
    }
  };
  
  export const restrictToRole = (role) => {
    return (req, res, next) => {
      if (!req.session.user) {
        return res.redirect("/login");
      }
      if (role && req.session.user.role !== role) {
        return res.status(403).send("Bu sayfaya erişim yetkiniz yok.");
      }
      next();
    };
  };