import { Request, Response, NextFunction } from "express";
export const isLoggedIn = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    (req.session as any).returnTo = req.originalUrl;

    req.flash("error", "You must be logged in first!");
    return res.redirect("/login");
  }

  next();
};
