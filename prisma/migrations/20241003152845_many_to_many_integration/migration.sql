/*
  Warnings:

  - You are about to drop the column `listId` on the `item` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `item` DROP FOREIGN KEY `Item_listId_fkey`;

-- AlterTable
ALTER TABLE `item` DROP COLUMN `listId`;

-- AlterTable
ALTER TABLE `list` MODIFY `name` VARCHAR(191) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE `ListOfItems` (
    `listId` INTEGER NOT NULL,
    `itemId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`listId`, `itemId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ListOfItems` ADD CONSTRAINT `ListOfItems_listId_fkey` FOREIGN KEY (`listId`) REFERENCES `List`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ListOfItems` ADD CONSTRAINT `ListOfItems_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `Item`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
