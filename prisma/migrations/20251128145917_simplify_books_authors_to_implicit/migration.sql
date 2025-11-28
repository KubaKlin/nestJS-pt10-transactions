/*
  Warnings:

  - You are about to drop the `BooksAuthors` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."BooksAuthors" DROP CONSTRAINT "BooksAuthors_bookId_fkey";

-- DropForeignKey
ALTER TABLE "public"."BooksAuthors" DROP CONSTRAINT "BooksAuthors_userId_fkey";

-- DropTable
DROP TABLE "public"."BooksAuthors";
