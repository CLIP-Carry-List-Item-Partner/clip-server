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
  unauthorized,
} from "@/utils/responses";


// Get all items)
export const getAllItems = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return unauthorized(res, "User not authorized");
    }

    const userId = req.user.id;

    const items = await db.item.findMany({
      where: {
        userId: userId,
      },
      include: {
        lists: {
          select: {
            list: {
              select: {
                id: true,
                name: true,
              }
            },
          },
        },
      }
    })
    
    return success(res, "Items fetched successfully", items);
  } catch (err) {
    return internalServerError(res);
  }
};


// Get item by id
export const getItemById = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return unauthorized(res, "User not authorized");
    }

    const userId = req.user.id;

    const validateId = itemIdSchema.safeParse({ id: String(req.params.id) });

    if (!validateId.success) {
      return validationError(res, parseZodError(validateId.error));
    }

    const item =  await db.item.findUnique({
      where: {
        id: validateId.data.id,
        userId: userId,
      },
      include: {
        lists: {
          select: {
            list: {
              select: {
                id: true,
                name: true,
              }
            },
          }
        },
      }
    })

    if (!item) {
      return notFound(res, `Item with id ${validateId.data.id} not found`);
    }

    return success(res, "Item fetched successfully", item);
  } catch (err) {
    return internalServerError(res);
  }
};

// Create Item
export const createItem = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return unauthorized(res, "User not authorized");
    }

    const userId = req.user.id;

    const validateItem = itemSchema.safeParse(req.body);

    if (!validateItem.success) {
      return validationError(res, parseZodError(validateItem.error));
    }

    const existingItem = await db.item.findUnique({
      where: {
        id: validateItem.data.id,
      },
    });

    if (existingItem) {
      return conflict(res, "Item already exists");
    }

    const newItem = await db.item.create({
      data: {
        id: validateItem.data.id,
        name: validateItem.data.name,
        userId: userId,
      },
    });

    return success(res, "Item created successfully", newItem);

  } catch (err) {
    return internalServerError(res);
  }
};


// Update item
export const updateItem = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return unauthorized(res, "User not authorized");
    }

    const userId = req.user.id;

    const validateId = itemIdSchema.safeParse({id: String(req.params.id)});
    
    if (!validateId.success) {
      return validationError(res, parseZodError(validateId.error));
    }

    const validateItem = itemUpdateSchema.safeParse(req.body);

    if (!validateItem.success) {
      return validationError(res, parseZodError(validateItem.error));
    }

    const item = await db.item.findUnique({
      where: {
        id: validateId.data.id,
        userId: userId,
      },
    });

    if (!item) {
      return notFound(res, `Item with id ${validateId.data.id} not found`);
    }

    const updatedItem = await db.item.update({
      where: {
        id: validateId.data.id,
      },
      data: {
        name: validateItem.data.name,
      },
    });

    return success(res, "Item successfully updated", updatedItem);

  } catch (err) {
    return internalServerError(res);
  }
};


// Delete Item
export const deleteItem = async(req: Request, res: Response) => {
  try {
    if(!req.user?.id){
      return unauthorized(res, "User not authorized")
    };

      const userId = req.user?.id

    const validateItem = itemIdSchema.safeParse({
      id: String(req.params.id)
    });

    if(!validateItem.success){
      return validationError(res, parseZodError(validateItem.error))
    };

    const item = await db.item.findUnique({
      where: {
        id: validateItem.data.id,
        userId: userId
      }
    })

    if(!item) {
      return notFound(res, "Item not found")
    }

    const list = await db.listOfItems.findMany({
      where: {
        itemId: validateItem.data.id
      },
      include:{
        list: {
          select: {
            name: true
          }
        }
      }
    })

    const listsToDelete = list.map(list => ({
      name: list.list.name
    }))

    if(list.length>0){
        await db.listOfItems.deleteMany({
        where: {
          itemId: validateItem.data.id
        }
      })
    }

    const deleteItem = await db.item.delete({
      where: {
        id: validateItem.data.id
      }
    })

    return success (res, "Item successfully deleted", {deleteItem, deletedFromList: listsToDelete})

  } catch (err) {
    return internalServerError(res)
  }
}


// // Add Item to List (ini nanti dulu aja)
// export const addItemToList = async (req: Request, res: Response) => {
//   try {
//     const { listId, itemId } = req.body;

//     if (!listId || !itemId) {
//       return validationError(res, "listId and itemId are required");
//     }

//     // Cek list
//     const list = await db.list.findUnique({
//       where: {
//         id: listId,
//       },
//     });

//     if (!list) {
//       return notFound(res, "List not found");
//     }

//     // Cek item
//     const item = await db.item.findUnique({
//       where: {
//         id: itemId,
//       },
//     });

//     if (!item) {
//       return notFound(res, "Item not found");
//     }

//     // Cek apakah relasi sudah ada
//     const existingRelation = await db.listOfItems.findUnique({
//       where: {
//         listId_itemId: {
//           listId: listId,
//           itemId: itemId,
//         },
//       },
//     });

//     if (existingRelation) {
//       return conflict(res, "Item already exists in the list");
//     }

//     // Buat relasi baru di tabel
//     const newRelation = await db.listOfItems.create({
//       data: {
//         listId: listId,
//         itemId: itemId,
//       },
//     });

//     return success(res, "Item added to list successfully", newRelation);
//   } catch (err) {
//     console.error(err);
//     return internalServerError(res);
//   }
// };

