import { Router } from 'express';

import {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
} from '@/controllers/item.controller';

const router = Router();
router.get("/", getAllItems);
router.get("/:id", getItemById);
router.post("/create", createItem);
router.put("/update/:id", updateItem)
router.delete("/delete/:id", deleteItem)

export default router;