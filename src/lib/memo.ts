import prisma from "./prisma";

// ponytail: in-process TTL memo. Cache is local to the Node.js process and dies on restart.
// Perfect for single-container deployments (docker-compose) or multi-replica setups
// where a 30s counter badge staleness across replicas is completely harmless.

type CacheEntry<T> = {
  value: T;
  expires: number;
};

const cache = new Map<string, CacheEntry<any>>();
const inFlight = new Map<string, Promise<any>>();

/**
 * Generic promise-deduplicating in-process TTL memoization helper.
 */
export async function memo<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const cached = cache.get(key);

  if (cached && cached.expires > now) {
    return cached.value as T;
  }

  // Deduplicate simultaneous requests for the same key
  const existingPromise = inFlight.get(key);
  if (existingPromise) {
    return existingPromise as Promise<T>;
  }

  const promise = fn()
    .then((result) => {
      cache.set(key, { value: result, expires: Date.now() + ttlMs });
      inFlight.delete(key);
      return result;
    })
    .catch((err) => {
      inFlight.delete(key);
      throw err;
    });

  inFlight.set(key, promise);
  return promise;
}

/**
 * Cached per-user announcement badge counter (30s TTL).
 * Replaces the heavy announcement query that runs on every layout render / page transition.
 */
export async function getCachedUserAnnouncementCount(user: {
  id?: string;
  role?: string;
}): Promise<number> {
  if (!user || !user.id || !user.role) return 0;

  const cacheKey = `announce-count:${user.id}:${user.role}`;

  return memo(cacheKey, 30_000, async () => {
    let audienceWhere: any = { classId: null };

    if (user.role === "admin") {
      audienceWhere = {};
    } else if (user.role === "teacher") {
      audienceWhere = {
        OR: [
          { classId: null },
          { teacherId: user.id },
          {
            class: {
              OR: [{ supervisorId: user.id }, { lessons: { some: { teacherId: user.id } } }],
            },
          },
        ],
      };
    } else if (user.role === "student") {
      audienceWhere = {
        OR: [{ classId: null }, { class: { students: { some: { id: user.id } } } }],
      };
    } else if (user.role === "parent") {
      audienceWhere = {
        OR: [{ classId: null }, { class: { students: { some: { parentId: user.id } } } }],
      };
    }

    return prisma.announcement.count({
      where: audienceWhere,
    });
  });
}
