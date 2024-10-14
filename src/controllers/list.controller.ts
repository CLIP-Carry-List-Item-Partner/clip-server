import type { Request, Response } from "express";
import db from "@/services/db";
import { deleteItemSchema, listSchema, listUpdateSchema } from "@/models/list.model";
import { idSchema } from "@/models/id.model";
import { z } from "zod";

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
import { itemSchema } from "@/models/item.model";

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

    const user = await db.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return notFound(res, "User not found");
    }

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

  if (!list) {
    return notFound(res, `List with id ${validateId.data.id} not found`);
  }

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

    const checkUserId = await db.user.findUnique({
      where: {
        id: req.user!.id,
      },
    });

    if (!checkUserId) {
      return notFound(res, "User not found");
    }

    const validateBody = listSchema.safeParse(req.body);

    if(!validateBody.success) {
      return validationError(res, parseZodError(validateBody.error))
    }

    const listId = await generateListId();

    if (!listId){
      return internalServerError(res)
    }

    // Create New List
    const list = await db.list.create({
      data: {
        id: listId,
        name: validateBody.data.name,
        userId: checkUserId.id,
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
    // Memastikan user sudah terautentikasi (req.user diambil dari JWT)
    if (!req.user?.id) {
      return unauthorized(res, "User not authorized");
    }

    const userId = req.user.id; // Mengambil userId dari token JWT

    // Validasi ID list
    const validateId = idSchema.safeParse({ id: Number(req.params.id) });
    if (!validateId.success) {
      return validationError(res, parseZodError(validateId.error));
    }

    // Validasi body request
    const validateBody = listUpdateSchema.safeParse(req.body);
    if (!validateBody.success) {
      return validationError(res, parseZodError(validateBody.error));
    }

    // Cari list berdasarkan id dan userId yang login
    const list = await db.list.findUnique({
      where: { 
        id: validateId.data.id,
        userId: userId, // Filter berdasarkan userId dari pengguna yang sedang login
      },
    });

    if (!list) {
      return notFound(res, `List with id ${validateId.data.id} not found or you don't have permission to update it`);
    }

    // Siapkan data untuk di-update
    const updateData: any = {
      name: validateBody.data.name,
    };

    // Jika ada items di dalam request body
    if (validateBody.data.items && validateBody.data.items.length > 0) {
      // Cek apakah semua item sudah ada di tabel item
      for (const item of validateBody.data.items) {
        const existingItem = await db.item.findUnique({
          where: { id: item.id },
        });

        if (!existingItem) {
          return validationError(
            res,
            `Item with id ${item.id} does not exist in the items table, please add the item first`
          );
        }
      }

      // Jika semua item valid, lakukan connectOrCreate
      updateData.items = {
        connectOrCreate: validateBody.data.items.map((item: any) => ({
          where: {
            listId_itemId: {
              listId: validateId.data.id,
              itemId: item.id,
            },
          },
          create: {
            item: {
              connectOrCreate: {
                where: { id: item.id },
                create: { id: item.id, name: item.name },
              },
            },
          },
        })),
      };
    }

    // Update list
    const updatedList = await db.list.update({
      where: {
        id: validateId.data.id,
      },
      data: updateData,
      include: {
        items: {
          select: {
            item: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return success(res, "List updated successfully", updatedList);
  } catch (err) {
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

    // apakah ini perlu?
    const checkUserId = await db.user.findUnique({
      where: {
        id: userId,
      }
    })

    if(!checkUserId){
      return notFound(res, "User not found");
    }

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

    const checkUserId = await db.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!checkUserId) {
      return notFound(res, "User not found");
    }

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
      },
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
