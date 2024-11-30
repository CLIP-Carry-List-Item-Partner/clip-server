import { Router } from "express";
import {
  getAllList,
  getListById,
  createList,
  updateList,
  deleteList,
  deleteItemsInList,
} from '@/controllers/list.controller';
import verifyJwt  from '@/middlewares/verifyJwt.middleware';

const router = Router();
router.get("/", verifyJwt,getAllList);
router.get("/:id", verifyJwt, getListById);
router.post("/create", verifyJwt, createList);
router.put("/update/:id",  verifyJwt, updateList);
router.delete("/delete/:id", verifyJwt, deleteList);
// ini belum pasti ada (bisa nanti hit endpoint khusus untuk item)
router.delete("/delete/:listId/item/:itemId", verifyJwt, deleteItemsInList);

export default router;