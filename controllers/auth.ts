import { Request, Response as ExpressResponse } from "express";
import { RowDataPacket } from "mysql2";
import { con } from "../model/db";

interface Response extends ExpressResponse {
  render: (view: string, locals?: Record<string, any>) => void;
}

export const renderSignup = async (req: Request, res: Response) => {
  res.render("/signup");
};

export const renderLogin = async (req: Request, res: Response) => {
  res.render("/login");
};
