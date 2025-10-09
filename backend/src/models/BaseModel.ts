import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';
import { CacheService } from '@/config/redis';

export abstract class BaseModel {
  protected prisma: PrismaClient;
  protected cache: CacheService;
  protected modelName: string;

  constructor(prisma: PrismaClient, modelName: string) {
    this.prisma = prisma;
    this.cache = CacheService.getInstance();
    this.modelName = modelName;
  }

  // Generic cache key generator
  protected getCacheKey(operation: string, params?: any): string {
    const paramsStr = params ? JSON.stringify(params) : '';
    return `${this.modelName}:${operation}:${paramsStr}`;
  }

  // Generic cache get with fallback
  protected async getCachedOrFetch<T>(
    cacheKey: string,
    fetchFn: () => Promise<T>,
    ttl: number = 300
  ): Promise<T> {
    try {
      const cached = await this.cache.get<T>(cacheKey);
      if (cached) {
        return cached;
      }

      const result = await fetchFn();
      await this.cache.set(cacheKey, result, ttl);
      return result;
    } catch (error) {
      logger.error(`Cache operation failed for key ${cacheKey}:`, error);
      return await fetchFn();
    }
  }

  // Invalidate cache patterns
  protected async invalidateCache(pattern: string): Promise<void> {
    try {
      // In a real implementation, you'd use Redis SCAN to find and delete matching keys
      // For now, we'll implement a simple approach
      await this.cache.del(pattern);
    } catch (error) {
      logger.error(`Cache invalidation failed for pattern ${pattern}:`, error);
    }
  }

  // Generic pagination helper
  protected getPaginationParams(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    return { skip, take: limit };
  }

  // Generic sort helper
  protected getSortParams(sortBy?: string, sortOrder: 'asc' | 'desc' = 'desc') {
    if (!sortBy) return {};
    return { [sortBy]: sortOrder };
  }
}