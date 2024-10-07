import type { Request, Response } from "express";
import db from "@/services/db";
import { listSchema, listUpdateSchema } from "@/models/list.model";
import { idSchema } from "@/models/id.model";
import { nanoid } from "nanoid";

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
  try  {
    // Fetch all lists
    const list = await db.list.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Fetch Items for each list
    const fetchItems = async (list: any) => {
      const items = await db.listOfItems.findMany({
        where: {
          listId: {
            in: list.map((list: any) => list.id),
          },
        },
        select: {
          item: {
            select: {
            id:true,
          },
        },
      },
    });
    return items;
  };

  const listWithItems = await Promise.all(
    list.map(async (list: any) => {
      const items = await fetchItems(list);
      return {
        ...list,
        items,
      };
    })
  )
  return success(res, "List fetched successfully", listWithItems);
  } catch (err) {
    return internalServerError(res);
  }
};

// Get specific List by ID
export const getListById = async (req: Request, res: Response) => {
  try {
    const validateId = idSchema.safeParse(req.body) 
  
  if (!validateId.success) {
    return validationError(res, parseZodError(validateId.error));
  }

  const list = await db.list.findUnique({
    where: {
      id: validateId.data.id
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });

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
    const userId = req.user?.id;

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
        name: validateBody.data.name,
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
    const validateId = idSchema.safeParse(req.body);

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

