import { Router } from 'express';

import {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  addItemToList,
} from '@/controllers/item.controller';
import verifyJwt  from '@/middlewares/verifyJwt.middleware';

const router = Router();
router.get("/", verifyJwt, getAllItems);
router.get("/:id", verifyJwt,getItemById);
router.post("/create", verifyJwt,createItem);
router.put("/update/:id", updateItem)
router.delete("/delete/:id", deleteItem)
router.post("/addtolist", addItemToList)

export default router;