import type { Request, Response } from "express";
import db from "@/services/db";
import { itemSchema, itemUpdateSchema } from "@/models/item.model";
import { itemIdSchema } from "@/models/itemId.model";

import {
  success,
  badRequest,
  Responses,
  conflict,
  notFound,
  forbidden,
  created,
  internalServerError,
  validationError,
  parseZodError,
} from "@/utils/responses";


// Generate ItemId

// async function generateItemId() {
//   try {
//     const item = await db.item.findMany();
//     if (item.length === 0) {
//       return 1;
//     }

//     const lastItem = item[item.length - 1];
//     return lastItem.id + 1;
//   } catch (err) {
//     return null;
//   }
// }


// Get all items
export const getAllItems = async (req: Request, res: Response) => {
  try {
    const items = await db.item.findMany(
      {
        select: {
          id: true,
          name: true, 
          createdAt: true,
          updatedAt: true,
        },
      }
    );

    return success(res, "Items fetched successfully", items);
  } catch (err) {
    return internalServerError(res);
  }
}

// Get item by id
export const getItemById = async (req: Request, res: Response) => {
  try {
    const validateId = itemIdSchema.safeParse({id: String(req.params.id)})

    if(!validateId.success) {
      return validationError(res, parseZodError(validateId.error))
    }

    const item = await db.item.findUnique({
      where: {
        id: validateId.data.id,
      },
    })

    return success(res, "Item fetched successfully", item);

  } catch (err) {
    return internalServerError (res);
  }
}

// Create item
export const createItem = async (req: Request, res: Response) => {
  try {
    const validateItem = itemSchema.safeParse(req.body);

    if(!validateItem.success) {
      return validationError(res, parseZodError(validateItem.error));
    } 

    const newItem = await db.item.create({
      data: {
        id: validateItem.data.id,
        name: validateItem.data.name,
      }
    })
    
    return success(res, "Item create successfully", newItem);

  } catch (err) {
    return internalServerError(res);
  }
}

// Update item
export const updateItem = async (req: Request, res: Response) => {
  try {
    const validateItem = itemUpdateSchema.safeParse(req.body)

    if(!validateItem.success) {
      return validationError(res, parseZodError(validateItem.error))
    }

    const item = await db.item.findUnique({
      where: {
        id: validateItem.data.id,
      }
    })

    if(!item){
      return notFound(res, "Item not found")
    }

    const updateItem = await db.item.update({
      where: {
        id: validateItem.data.id
      },
      data: {
        name: validateItem.data.name
      }
    })

    return success (res, "Item successfully updated", updateItem)

  } catch (err) {
    return internalServerError(res)
  }
}

// Delete Item
export const deleteItem = async(req: Request, res: Response) => {
  try {
    const validateItem = itemIdSchema.safeParse({
      id: String(req.params.id)
    });

    if(!validateItem.success){
      return validationError(res, parseZodError(validateItem.error))
    };

    const item = await db.item.findUnique({
      where: {
        id: validateItem.data.id,
      }
    })

    if(!item) {
      return notFound(res, "Item not found")
    }

    const deleteItem = await db.item.delete({
      where: {
        id: validateItem.data.id
      }
    })

    return success (res, "Item successfully deleted", deleteItem)
  } catch (err) {
    return internalServerError(res)
  }
}