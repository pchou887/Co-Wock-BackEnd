import { Request, Response, NextFunction } from "express";
import verifyJWT from "../utils/verifyJWT.js";

async function tokenTranslate(req: Request, res: Response, next: NextFunction) {
  try {
    const tokenInHeaders = req.get("Authorization");
    const token =
      tokenInHeaders?.replace("Bearer ", "") || req.cookies.jwtToken;
    const decoded = token ? await verifyJWT(token) : null;
    res.locals.userId = decoded ? decoded.userId : null;
    next();
  } catch (err) {
    if (err instanceof Error) {
      res.status(401).json({ errors: err.message });
      return;
    }
    res.status(401).json({ errors: "authenticate failed" });
  }
}

export default tokenTranslate;
