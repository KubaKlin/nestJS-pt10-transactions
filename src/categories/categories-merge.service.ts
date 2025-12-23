import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class CategoriesMergeService {
  constructor(private readonly prismaService: PrismaService) {}

  private normalizeCategoryName(categoryName: string) {
    return categoryName.toLowerCase().trim();
  }

  private async findAllCategoriesForMerge(
    transactionClient: Prisma.TransactionClient,
  ) {
    return await transactionClient.category.findMany({
      // Sorting by id ensures the "oldest" category is always categories[0] per group.
      orderBy: {
        id: 'asc',
      },
      select: {
        id: true,
        name: true,
        articles: {
          select: {
            id: true,
          },
        },
      },
    });
  }

  private groupCategoriesByNormalizedName(
    categories: Array<{
      id: number;
      name: string;
      articles: Array<{ id: number }>;
    }>,
  ) {
    const categoryGroups = new Map<
      string,
      Array<(typeof categories)[number]>
    >();

    categories.forEach((category) => {
      const normalizedName = this.normalizeCategoryName(category.name);
      const existing = categoryGroups.get(normalizedName) || [];
      existing.push(category);
      categoryGroups.set(normalizedName, existing);
    });

    return categoryGroups;
  }

  private getMergedCategories(
    normalizedName: string,
    categories: Array<{
      id: number;
      name: string;
      articles: Array<{ id: number }>;
    }>,
  ) {
    // Nothing to merge if this normalized name has 0 or 1 category.
    if (categories.length <= 1) {
      return null;
    }

    // Keep the oldest category (lowest id) as the canonical one.
    const oldestCategory = categories[0];
    // Everything else in the group is treated as a duplicate.
    const duplicateCategories = categories.slice(1);
    // Delete all duplicates after transferring article relations.
    const duplicateCategoryIds = duplicateCategories.map((category) => category.id);

    // Track articles already connected to the canonical category.
    const existingArticleIds = new Set(
      oldestCategory.articles.map((article) => article.id),
    );

    // Collect all article ids connected to any duplicate category.
    const allDuplicateArticleIds = new Set(
      duplicateCategories.flatMap((category) =>
        category.articles.map((article) => article.id),
      ),
    );

    // Only connect articles that are not already connected to the canonical category.
    const uniqueArticleIds = [...allDuplicateArticleIds].filter(
      (articleId) => !existingArticleIds.has(articleId),
    );

    // Return a small “plan” for merging this group
    return {
      normalizedName,
      oldestCategory,
      duplicateCategoryIds,
      uniqueArticleIds,
      articlesTransferred: allDuplicateArticleIds.size,
    };
  }

  private async connectUniqueArticlesToCanonicalCategory(
    transactionClient: Prisma.TransactionClient,
    canonicalCategoryId: number,
    uniqueArticleIds: number[],
  ) {
    if (uniqueArticleIds.length === 0) {
      return;
    }

    await transactionClient.category.update({
      where: {
        id: canonicalCategoryId,
      },
      data: {
        articles: {
          connect: uniqueArticleIds.map((id) => ({ id })),
        },
      },
    });
  }

  private async deleteDuplicateCategories(
    transactionClient: Prisma.TransactionClient,
    duplicateCategoryIds: number[],
  ) {
    if (duplicateCategoryIds.length === 0) {
      return;
    }

    await transactionClient.category.deleteMany({
      where: {
        id: {
          in: duplicateCategoryIds,
        },
      },
    });
  }

  private async mergeOneCategoryGroup(
    transactionClient: Prisma.TransactionClient,
    normalizedName: string,
    categories: Array<{
      id: number;
      name: string;
      articles: Array<{ id: number }>;
    }>,
  ) {
    const categoriesMergeResult = this.getMergedCategories(
      normalizedName,
      categories,
    );

    if (!categoriesMergeResult) {
      return null;
    }

    const {
      oldestCategory,
      duplicateCategoryIds,
      uniqueArticleIds,
      articlesTransferred,
    } = categoriesMergeResult;

    await this.connectUniqueArticlesToCanonicalCategory(
      transactionClient,
      oldestCategory.id,
      uniqueArticleIds,
    );

    await this.deleteDuplicateCategories(transactionClient, duplicateCategoryIds);

    return {
      categoryName: oldestCategory.name,
      keptCategoryId: oldestCategory.id,
      deletedCategoryIds: duplicateCategoryIds,
      articlesTransferred,
    };
  }

  private buildMergeDuplicateCategoriesResponse(
    mergeResults: Array<{
      categoryName: string;
      keptCategoryId: number;
      deletedCategoryIds: number[];
      articlesTransferred: number;
    }>,
  ) {
    return {
      message:
        mergeResults.length > 0
          ? `Successfully merged ${mergeResults.length} duplicate category group(s)`
          : 'No duplicate categories found',
      mergedCategories: mergeResults,
      totalMerged: mergeResults.length,
    };
  }

  async mergeDuplicateCategories() {
    // Run everything in a single transaction to keep the database consistent:
    return await this.prismaService.$transaction(async (transactionClient) => {
      const allCategories =
        await this.findAllCategoriesForMerge(transactionClient);

      // Group categories by a normalized version of their name so find duplicates.
      const categoryGroups = this.groupCategoriesByNormalizedName(allCategories);

      // Collect a report of all merges performed in this run.
      const mergeResults = [];

      // Merge each group independently.
      for (const [normalizedName, categories] of categoryGroups.entries()) {
        const mergeResult = await this.mergeOneCategoryGroup(
          transactionClient,
          normalizedName,
          categories,
        );
        if (mergeResult) {
          mergeResults.push(mergeResult);
        }
      }

      return this.buildMergeDuplicateCategoriesResponse(mergeResults);
    });
  }
}
