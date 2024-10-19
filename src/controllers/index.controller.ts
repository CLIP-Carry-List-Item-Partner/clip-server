import type { Request, Response } from "express";
import { success } from "@/utils/responses";

export const index = async (_req: Request, res: Response) => {
  return success(res, "Welcome to CLIP API");
}