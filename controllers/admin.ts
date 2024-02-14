import { Request, Response, NextFunction } from "express";

export const renderAdminHome = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.render("admin/home");
};

export const renderAddPet = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.render("admin/add_pet");
};
export const renderRequests = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.render("admin/requests");
};
export const renderHistory = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.render("admin/history");
};
