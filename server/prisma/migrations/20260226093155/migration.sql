-- CreateTable
CREATE TABLE `user` (
    `id` BIGINT NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(191) NULL,
    `avatar` VARCHAR(191) NULL,
    `password` VARCHAR(191) NOT NULL,
    `state` TINYINT NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `file` (
    `id` BIGINT NOT NULL,
    `key` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `size` BIGINT NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `url` VARCHAR(512) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `created_by` BIGINT NULL,
    `updated_by` BIGINT NULL,
    `owner` BIGINT NULL,

    UNIQUE INDEX `file_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tag` (
    `id` BIGINT NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `created_by` BIGINT NULL,
    `updated_by` BIGINT NULL,
    `owner` BIGINT NULL,

    UNIQUE INDEX `tag_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `file` ADD CONSTRAINT `file_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `file` ADD CONSTRAINT `file_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `file` ADD CONSTRAINT `file_owner_fkey` FOREIGN KEY (`owner`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tag` ADD CONSTRAINT `tag_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tag` ADD CONSTRAINT `tag_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tag` ADD CONSTRAINT `tag_owner_fkey` FOREIGN KEY (`owner`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
