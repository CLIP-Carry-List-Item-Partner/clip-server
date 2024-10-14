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
    // Memastikan user sudah terautentikasi (req.user diambil dari JWT)
    if (!req.user?.id) {
      return unauthorized(res, "User not authorized");
    }

    const userId = req.user.id; // Mengambil userId dari token JWT

    // Mencari semua item yang terkait dengan list milik user yang sedang login
    const items = await db.item.findMany({
      where: {
        lists: {
          some: {
            list: {
              userId: userId, // Filter berdasarkan userId dari pengguna yang sedang login
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        lists: {
          select: {
            list: {
              select: {
                id: true,
                name: true,
                userId: true,
              },
            },
          },
        },
      },
    });

    // Mengembalikan item yang ditemukan
    return success(res, "Items fetched successfully", items);
  } catch (err) {
    return internalServerError(res);
  }
};


// Get item by id
export const getItemById = async (req: Request, res: Response) => {
  try {
    // Memastikan user sudah terautentikasi (req.user diambil dari JWT)
    if (!req.user?.id) {
      return unauthorized(res, "User not authorized");
    }

    const userId = req.user.id; // Mengambil userId dari token JWT

    // Validasi id item
    const validateId = itemIdSchema.safeParse({ id: String(req.params.id) });
    if (!validateId.success) {
      return validationError(res, parseZodError(validateId.error));
    }

    // Mencari item berdasarkan id dan memastikan item terkait dengan list milik user yang login
    const item = await db.item.findUnique({
      where: {
        id: validateId.data.id,
      },
      include: {
        lists: {
          select: {
            list: {
              select: {
                name: true,
                userId: true, // Tambahkan userId untuk validasi
              },
            },
          },
        },
      },
    });

    // Jika item tidak ditemukan
    if (!item) {
      return notFound(res, `Item with id ${validateId.data.id} not found`);
    }

    // Memastikan item terkait dengan list milik user yang sedang login
    const isUserAuthorized = item.lists.some((listRelation) => listRelation.list.userId === userId);
    if (!isUserAuthorized) {
      return unauthorized(res, "User not authorized to access this item");
    }

    // Mengembalikan item yang valid dan sesuai dengan user yang login
    return success(res, "Item fetched successfully", item);
  } catch (err) {
    return internalServerError(res);
  }
};


// Create item (ini masih salah)
export const createItem = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return unauthorized(res, "User not authorized");
    }

    const userId = req.user.id;

    // Validasi input item
    const validateItem = itemSchema.safeParse(req.body);

    if (!validateItem.success) {
      return validationError(res, parseZodError(validateItem.error));
    }

    // Validasi apakah list terkait dengan user yang sedang login
    const list = await db.list.findFirst({
      where: {
        id: validateItem.data.listId, // Pastikan listId ada di input
        userId: userId,
      },
    });

    if (!list) {
      return notFound(res, `List with id ${validateItem.data.listId} not found for this user`);
    }

    // Membuat item baru
    const newItem = await db.item.create({
      data: {
        id: validateItem.data.id, // didapat dari hasil scan label dengan CLIP
        name: validateItem.data.name,
      },
    });

    return success(res, "Item created and linked to list successfully", newItem);

  } catch (err) {
    return internalServerError(res);
  }
};


// Update item
export const updateItem = async (req: Request, res: Response) => {
  try {
    // Validasi ID item
    const validateId = itemIdSchema.safeParse({id: String(req.params.id)});
    
    if (!validateId.success) {
      return validationError(res, parseZodError(validateId.error));
    }

    // Validasi data item yang akan diupdate
    const validateItem = itemUpdateSchema.safeParse(req.body);

    if (!validateItem.success) {
      return validationError(res, parseZodError(validateItem.error));
    }

    // Pastikan user sudah login
    if (!req.user?.id) {
      return unauthorized(res, "User not authorized");
    }

    const userId = req.user.id;

    // Cari item di database berdasarkan ID
    const item = await db.item.findUnique({
      where: {
        id: validateId.data.id,
      },
    });

    if (!item) {
      return notFound(res, `Item with id ${validateId.data.id} not found`);
    }

    // Validasi apakah item tersebut terkait dengan list milik user yang sedang login
    const listOfItems = await db.listOfItems.findFirst({
      where: {
        itemId: item.id,
        list: {
          userId: userId, // Memastikan list yang terkait dimiliki oleh user
        },
      },
      include: {
        list: true,
      },
    });

    if (!listOfItems) {
      return unauthorized(res, "You do not have permission to update this item");
    }

    // Update item
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


// Add Item to List
export const addItemToList = async (req: Request, res: Response) => {
  try {
    const { listId, itemId } = req.body;

    if (!listId || !itemId) {
      return validationError(res, "listId and itemId are required");
    }

    // Cek list
    const list = await db.list.findUnique({
      where: {
        id: listId,
      },
    });

    if (!list) {
      return notFound(res, "List not found");
    }

    // Cek item
    const item = await db.item.findUnique({
      where: {
        id: itemId,
      },
    });

    if (!item) {
      return notFound(res, "Item not found");
    }

    // Cek apakah relasi sudah ada
    const existingRelation = await db.listOfItems.findUnique({
      where: {
        listId_itemId: {
          listId: listId,
          itemId: itemId,
        },
      },
    });

    if (existingRelation) {
      return conflict(res, "Item already exists in the list");
    }

    // Buat relasi baru di tabel
    const newRelation = await db.listOfItems.create({
      data: {
        listId: listId,
        itemId: itemId,
      },
    });

    return success(res, "Item added to list successfully", newRelation);
  } catch (err) {
    console.error(err);
    return internalServerError(res);
  }
};

