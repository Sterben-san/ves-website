ALTER TABLE `Project`
  ADD COLUMN `mapUrl` TEXT NULL,
  ADD COLUMN `galleryImages` JSON NULL;

UPDATE `Project` SET `galleryImages` = JSON_ARRAY() WHERE `galleryImages` IS NULL;

ALTER TABLE `Project` MODIFY COLUMN `galleryImages` JSON NOT NULL;
