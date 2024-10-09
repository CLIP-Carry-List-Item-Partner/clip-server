import type { Request, Response } from "express";
import db from "@/services/db";
import { listSchema, listUpdateSchema } from "@/models/list.model";
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
    // Mencari list yang ada di database
    const lists = await db.list.findMany({
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
          items: items.map((item) => ({itemId: item.item.id, itemName: item.item.name})),
        };
      })
    )
    return success(res, "List fetched successfully", listsWithItems);
  } catch (err) {
    return internalServerError(res);
  }
};


// Get specific List by ID
export const getListById = async (req: Request, res: Response) => {
  try {
    const validateId = idSchema.safeParse({ id: Number(req.params.id) });
  
  if (!validateId.success) {
    return validationError(res, parseZodError(validateId.error));
  }

  const list = await db.list.findUnique({
    where: {
      id: validateId.data.id,
    },
    include: {
      items: {
        select: {
          itemId: true,
          listId: true,
        },
      },
    },
  })

  if (!list) {
    return notFound(res, "List not found");
  }

  return success(res, "List fetched successfully", list);
  } catch (err) {
    return internalServerError(res);
  }
};

// Create List
export const createList = async (req: Request,res: Response) => {
  try {
    const validateBody = listSchema.safeParse(req.body);

    if(!validateBody.success) {
      return validationError(res, parseZodError(validateBody.error))
    }

    const listId = await generateListId();

    if (!listId){
      return internalServerError(res)
    }

    // nanti perlu dicek lagi, buat controller untuk user dulu
    // untuk testing dulu aja, nanti perlu buat user nya beneran
    const userId = 1;

    if (!userId) {
      return validationError(res, "User not found");
    }

    // Create New List
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
    const validateBody = listUpdateSchema.safeParse(req.body);

    if(!validateBody.success){
      return validationError(res, parseZodError(validateBody.error));
    }

    const list = await db.list.findUnique({
      where: {
        id: validateBody.data.id,
      }
    });

    if (!list){
      return notFound(res, "List not found");
    }

    const updateList = await db.list.update({
      where: {
        id: validateBody.data.id,
      },
      data: {
        // update nama list
        name: validateBody.data.name,

        // update item (  )
        items: {
          create: {
            item: {
              create: {
                id: validateBody.data.item.id,
                name: validateBody.data.item.name,
              }
            }
          }
        }
        
      },
    })

    return success(res, "List updated successfully", updateList);
  } catch (err) {
    return internalServerError(res);
  }
}

// Delete List
export const deleteList = async (req: Request, res: Response) =>  {
  try {
    const validateId = idSchema.safeParse({
      id: Number(req.params.id),
    });

    if (!validateId.success) {
      return validationError(res, parseZodError(validateId.error));
    }

    const list = await db.list.findUnique({
      where: {
        id: validateId.data.id,
      }
    })

    if(!list){
      return notFound(res, "List not found");
    }

    // Check related items
    const items = await db.listOfItems.findMany({
      where: {
        listId: validateId.data.id,
      }
    });

    if (items.length > 0) {
      return conflict(res, "List has related items, please delete the items first");
    }

    const deleteList = await db.list.delete({
      where: {
        id: validateId.data.id,
      }
    })

    return success(res, "List deleted successfully", deleteList);
  } catch (err) {
    return internalServerError(res);
  }
}

