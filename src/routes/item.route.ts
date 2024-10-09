import { Router } from 'express';

import {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  addItemToList,
} from '@/controllers/item.controller';

const router = Router();
router.get("/", getAllItems);
router.get("/:id", getItemById);
router.post("/create", createItem);
router.put("/update/:id", updateItem)
router.delete("/delete/:id", deleteItem)
router.post("/addtolist", addItemToList)

export default router;