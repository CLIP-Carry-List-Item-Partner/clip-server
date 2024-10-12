import { Router } from "express";
import {
  getAllList,
  getListById,
  createList,
  updateList,
  deleteList,
  deleteItemsInList,
} from '@/controllers/list.controller';

const router = Router();
router.get("/", getAllList);
router.get("/:id", getListById);
router.post("/create", createList);
router.put("/update/:id", updateList);
router.delete("/delete/:id", deleteList);
router.delete("/delete/:listId/item/:itemId", deleteItemsInList);

export default router;