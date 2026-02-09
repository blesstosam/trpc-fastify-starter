/*
  Warnings:

  - The primary key for the `tag` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `user` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE `tag` DROP PRIMARY KEY,
    MODIFY `id` BIGINT NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `user` DROP PRIMARY KEY,
    MODIFY `id` BIGINT NOT NULL,
    ADD PRIMARY KEY (`id`);
