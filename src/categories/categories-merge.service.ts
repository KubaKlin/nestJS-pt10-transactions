import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class CategoriesMergeService {
  constructor(private readonly prismaService: PrismaService) {}

  async mergeDuplicateCategories() {
    return await this.prismaService.$transaction(async (transactionClient) => {
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

      const categoryGroups = new Map<
        string,
        Array<(typeof allCategories)[number]>
      >();

      allCategories.forEach((category) => {
        const normalizedName = category.name.toLowerCase().trim();
        const existing = categoryGroups.get(normalizedName) || [];
        existing.push(category);
        categoryGroups.set(normalizedName, existing);
      });

      const mergeResults = [];

      for (const [normalizedName, categories] of categoryGroups.entries()) {
        if (categories.length > 1) {
          const oldestCategory = categories[0];
          const duplicateCategories = categories.slice(1);
          const duplicateCategoryIds = duplicateCategories.map(
            (category) => category.id,
          );

          const existingArticleIds = new Set(
            oldestCategory.articles.map((article) => article.id),
          );

          const allDuplicateArticleIds = new Set(
            duplicateCategories.flatMap((category) =>
              category.articles.map((article) => article.id),
            ),
          );

          const uniqueArticleIds = [...allDuplicateArticleIds].filter(
            (articleId) => !existingArticleIds.has(articleId),
          );

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

          await transactionClient.category.deleteMany({
            where: {
              id: {
                in: duplicateCategoryIds,
              },
            },
          });

          mergeResults.push({
            categoryName: oldestCategory.name,
            keptCategoryId: oldestCategory.id,
            deletedCategoryIds: duplicateCategoryIds,
            articlesTransferred: allDuplicateArticleIds.size,
          });
        }
      }

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
