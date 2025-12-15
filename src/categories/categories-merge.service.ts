import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class CategoriesMergeService {
  constructor(private readonly prismaService: PrismaService) {}

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

  async mergeDuplicateCategories() {
    // Run everything in a single transaction to keep the database consistent:
    return await this.prismaService.$transaction(async (transactionClient) => {
      // Fetch all categories along with their article relations.
      // Sorting by id ensures the "oldest" category is always categories[0] per group.
      const allCategories = await transactionClient.category.findMany({
        orderBy: {
          id: 'asc',
        },
        include: {
          articles: {
            select: {
              id: true,
            },
          },
        },
      });

      // Group categories by a normalized version of their name so find duplicates.
      const categoryGroups = new Map<
        string,
        Array<(typeof allCategories)[number]>
      >();

      allCategories.forEach((category) => {
        // Normalize the name
        const normalizedName = category.name.toLowerCase().trim();
        const existing = categoryGroups.get(normalizedName) || [];
        existing.push(category);
        categoryGroups.set(normalizedName, existing);
      });

      // Collect a report of all merges performed in this run.
      const mergeResults = [];

      // Merge each group independently.
      for (const [normalizedName, categories] of categoryGroups.entries()) {
        const categoriesMergeResult = this.getMergedCategories(
          normalizedName,
          categories,
        );
        if (!categoriesMergeResult) {
          continue;
        }

        // Extract computed merge data for readability.
        const {
          oldestCategory,
          duplicateCategoryIds,
          uniqueArticleIds,
          articlesTransferred,
        } = categoriesMergeResult;

        // Connect any missing articles from duplicates onto the canonical category.
        if (uniqueArticleIds.length > 0) {
          await transactionClient.category.update({
            where: {
              id: oldestCategory.id,
            },
            data: {
              articles: {
                connect: uniqueArticleIds.map((id) => ({ id })),
              },
            },
          });
        }

        // Delete duplicate categories now that article relations have been transferred.
        await transactionClient.category.deleteMany({
          where: {
            id: {
              in: duplicateCategoryIds,
            },
          },
        });

        // Save a human-friendly summary for this merged group.
        mergeResults.push({
          categoryName: oldestCategory.name,
          keptCategoryId: oldestCategory.id,
          deletedCategoryIds: duplicateCategoryIds,
          articlesTransferred,
        });
      }

      // Return response payload.
      return {
        message:
          mergeResults.length > 0
            ? `Successfully merged ${mergeResults.length} duplicate category group(s)`
            : 'No duplicate categories found',
        mergedCategories: mergeResults,
        totalMerged: mergeResults.length,
      };
    });
  }
}
