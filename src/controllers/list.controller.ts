import type { Request, Response } from "express";
import db from "@/services/db";
import { deleteItemSchema, listSchema, listUpdateSchema } from "@/models/list.model";
import { idSchema } from "@/models/id.model";

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

// Generated ListID 
async function generateListId() {
  try {
    const list = await db.list.findMany();
    if (list.length === 0) {
      return 1;
    }
    const lastList = list[list.length - 1];
    return lastList.id + 1;
  } catch (err) {
    return null;
  }
}

// View All List
export const getAllList = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return unauthorized(res, "User not authorized");
    }

    const userId = req.user.id;

    const lists = await db.list.findMany({
      where: {
        userId: userId,
      },
      include: {
        items: {
          select: {
            itemId: true,
            listId: true,
          },
        },
      },
    });

    const listsWithItems = await Promise.all(
      lists.map(async (list) => {
        const items = await db.listOfItems.findMany({
          where: {
            listId: list.id,
          },
          select: {
            item: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        return {
          ...list,
          items: items.map((item) => ({ itemId: item.item.id, itemName: item.item.name })),
        };
      })
    );

    return success(res, "List fetched successfully", listsWithItems);
  } catch (err) {
    return internalServerError(res);
  }
};


// Get specific List by ID
export const getListById = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return unauthorized(res, "User not authorized");
    }

    const userId = req.user.id;

    const validateId = idSchema.safeParse({ id: Number(req.params.id) });
  
    if (!validateId.success) {
      return validationError(res, parseZodError(validateId.error));
    }

  const list = await db.list.findUnique({
    where: {
      id: validateId.data.id,
      userId: userId,
    },
    include: {
      items: {
        select: {
          item: {
            select: {
              id: true,
              name: true,
          }
        },
        listId: true,
      },
    },
  },
  })

  // if (!list) {
  //   return notFound(res, `List with id ${validateId.data.id} not found`);
  // }

  return success(res, "List fetched successfully", list);
  } catch (err) {
    return internalServerError(res);
  }
};

// Create List
export const createList = async (req: Request,res: Response) => {
  try {
    if (!req.user?.id) {
      return unauthorized(res, "User not authorized");
    }

    const userId = req.user.id;

    const validateBody = listSchema.safeParse(req.body);

    if(!validateBody.success) {
      return validationError(res, parseZodError(validateBody.error))
    }

    const listId = await generateListId();

    if (!listId){
      return internalServerError(res)
    }

    const list = await db.list.create({
      data: {
        id: listId,
        name: validateBody.data.name,
        userId: userId,
      },
    
    });

    return success(res, "List created successfully", list);
  } catch (err) {
    return internalServerError(res);
  }
}

// Update List
export const updateList = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return unauthorized(res, "User not authorized");
    }

    const userId = req.user.id;

    const validateId = idSchema.safeParse({
      id: Number(req.params.id),
    });

    if (!validateId.success) {
      return validationError(res, parseZodError(validateId.error));
    }

    const validateBody = listUpdateSchema.safeParse(req.body);

    if (!validateBody.success) {
      return validationError(res, parseZodError(validateBody.error));
    }

    const list = await db.list.findUnique({
      where: {
        id: validateId.data.id,
        userId: userId,
      },
      include: {
        items: true, // Include current items in the list
      },
    });

    if (!list) {
      return notFound(res, `List with id ${validateId.data.id} not found`);
    }

    // Update list name (this should happen regardless of whether items are provided)
    const updatedList = await db.list.update({
      where: {
        id: validateId.data.id,
      },
      data: {
        name: validateBody.data.name,
      },
    });

    // If items are provided, update the ListOfItems table
    if (validateBody.data.items && validateBody.data.items.length > 0) {
      const existingItems = list.items.map(item => item.itemId);
      const newItems = validateBody.data.items.map(item => item.id);

      // Add new items to the list
      const itemsToAdd = newItems.filter(itemId => !existingItems.includes(itemId));
      for (const itemId of itemsToAdd) {
        const item = await db.item.findUnique({
          where: {
            id: itemId,
          },
        });

        if (!item) {
          return notFound(res, `Item with id ${itemId} not found, please create the item first`);
        }

        await db.listOfItems.create({
          data: {
            listId: validateId.data.id,
            itemId,
            userId, 
          },
        });
      }
    }

    return success(res, "List updated successfully", updatedList);
  } catch (err) {
    console.error("Error:", err);
    return internalServerError(res);
  }
};


// Delete List
export const deleteList = async (req: Request, res: Response) =>  {
  try {
    if(!req.user?.id){
      return unauthorized(res, "User not authorized");
    }

    const userId = req.user.id;

    console.log("Received ID:", req.params.id);

    const validateId = idSchema.safeParse({
      id: Number(req.params.id),
    });

    if (!validateId.success) {
      return validationError(res, parseZodError(validateId.error));
    }

    const list = await db.list.findUnique({
      where: {
        id: validateId.data.id,
        userId: userId,
      }
    })

    if(!list){
      return notFound(res, "List not found");
    }   

    const items = await db.listOfItems.findMany({
      where: {
        listId: validateId.data.id
      },
      include: {
            item: {
              select: {
                id: true,
                name: true,
            }
          },
    },
    })

  const itemsToDelete = items.map(item => ({
      id: item.item.id,
      name: item.item.name,
    })); 

    if(items.length > 0){
      await db.listOfItems.deleteMany({
        where: {
          listId: validateId.data.id
        }
      })
    }

    const deleteList =  await db.list.delete({
        where: {
          id: validateId.data.id,
        }
      })

    return success(res, "List deleted successfully", {deleteList, itemsRemovedFromList: itemsToDelete});
  } catch (err) {
    return internalServerError(res);
  }
}

// Delete items in list
export const deleteItemsInList = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return unauthorized(res, "User not authorized");
    }

    const userId = req.user.id;

    const validateParams = deleteItemSchema.safeParse({
      listId: Number(req.params.listId),
      itemId: String(req.params.itemId),
    });

    if (!validateParams.success) {
      return validationError(res, parseZodError(validateParams.error));
    }

    const itemInList = await db.listOfItems.findFirst({
      where: {
        listId: validateParams.data.listId,
        itemId: validateParams.data.itemId,
        userId: userId,
      }
    });

    if (!itemInList) {
      return notFound(res, "Item not found in the list");
    }

    const deleteItemInList = await db.listOfItems.delete({
      where: {
        listId_itemId: {
          listId: validateParams.data.listId,
          itemId: validateParams.data.itemId,
        },
      },
    });

    return success(res, "Item deleted from list successfully", deleteItemInList);
  } catch (err) {
    console.error(err);
    return internalServerError(res);
  }
};
