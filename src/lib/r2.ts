import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import prisma from "@/lib/prisma";

export interface R2AccountConfig {
  id: string; // Unique identifier (e.g. "acc_1", "acc_2" or custom tag)
  accountId: string; // Cloudflare Account ID
  accessKeyId: string; // R2 Access Key ID
  secretAccessKey: string; // R2 Secret Access Key
  bucketName: string; // Bucket name
  publicUrl?: string; // Optional custom/r2.dev public domain
  enabled?: boolean; // Whether this account is active for new uploads
}

// In-memory cache for initialized S3 clients to prevent reconnection overhead
const clientCache = new Map<string, S3Client>();

/**
 * Loads all configured R2 accounts from environment variables.
 * Supports:
 * 1. Single default account: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
 * 2. Multi-accounts JSON: R2_ACCOUNTS_JSON='[{"id":"acc1", "accountId":"...", ...}, ...]'
 * 3. Indexed accounts: R2_ACC_1_ACCOUNT_ID, R2_ACC_1_ACCESS_KEY_ID, ...
 */
export function getR2Accounts(): R2AccountConfig[] {
  const accounts: R2AccountConfig[] = [];

  // 1. Check for JSON array of accounts
  if (process.env.R2_ACCOUNTS_JSON) {
    try {
      const parsed = JSON.parse(process.env.R2_ACCOUNTS_JSON);
      if (Array.isArray(parsed)) {
        accounts.push(...parsed);
      }
    } catch (err) {
      console.error("Failed to parse R2_ACCOUNTS_JSON environment variable:", err);
    }
  }

  // 2. Check for indexed accounts (e.g. R2_ACC_1_*, R2_ACC_2_*, etc.)
  for (let i = 1; i <= 20; i++) {
    const accId = process.env[`R2_ACC_${i}_ACCOUNT_ID`];
    const keyId = process.env[`R2_ACC_${i}_ACCESS_KEY_ID`];
    const secret = process.env[`R2_ACC_${i}_SECRET_ACCESS_KEY`];
    const bucket = process.env[`R2_ACC_${i}_BUCKET_NAME`];
    const pubUrl = process.env[`R2_ACC_${i}_PUBLIC_URL`];

    if (accId && keyId && secret && bucket) {
      accounts.push({
        id: `account_${i}`,
        accountId: accId,
        accessKeyId: keyId,
        secretAccessKey: secret,
        bucketName: bucket,
        publicUrl: pubUrl,
        enabled: true,
      });
    }
  }

  // 3. Fallback to default single account if no indexed/json accounts found
  const accountId =
    process.env.R2_ACCOUNT_ID ||
    process.env.CLOUDFLARE_R2_ACCOUNT_ID ||
    process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey =
    process.env.R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const bucketName =
    process.env.R2_BUCKET_NAME || process.env.CLOUDFLARE_R2_BUCKET_NAME || "emantra";
  const publicUrl =
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL || process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN;

  if (accounts.length === 0 && accountId && accessKeyId && secretAccessKey && bucketName) {
    accounts.push({
      id: "default",
      accountId,
      accessKeyId,
      secretAccessKey,
      bucketName,
      publicUrl,
      enabled: true,
    });
  }

  return accounts;
}

/**
 * Retrieves the S3 client instance for a given account configuration.
 */
export function getR2Client(account: R2AccountConfig): S3Client {
  const cacheKey = `${account.id}-${account.accountId}-${account.accessKeyId}`;
  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey)!;
  }

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${account.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: account.accessKeyId,
      secretAccessKey: account.secretAccessKey,
    },
  });

  clientCache.set(cacheKey, client);
  return client;
}

/**
 * Selects an active R2 account for new uploads (Round-Robin or Least Stored).
 */
export async function selectActiveR2Account(): Promise<R2AccountConfig> {
  const accounts = getR2Accounts().filter((a) => a.enabled !== false);
  if (accounts.length === 0) {
    throw new Error("No active Cloudflare R2 accounts configured in environment variables.");
  }

  if (accounts.length === 1) {
    return accounts[0];
  }

  // Query database to find which account currently has the lowest file count / stored size
  try {
    const counts = await prisma.storedFile.groupBy({
      by: ["accountId"],
      where: { deletedAt: null },
      _count: { id: true },
    });

    const countMap = new Map<string, number>();
    counts.forEach((c) => countMap.set(c.accountId, c._count.id));

    // Sort accounts by lowest number of stored files
    accounts.sort((a, b) => {
      const countA = countMap.get(a.id) || 0;
      const countB = countMap.get(b.id) || 0;
      return countA - countB;
    });

    return accounts[0];
  } catch (error) {
    // If DB query fails, fallback to random load distribution
    const randomIndex = Math.floor(Math.random() * accounts.length);
    return accounts[randomIndex];
  }
}

/**
 * Generate a pre-signed URL for direct browser upload with multi-account routing & DB tracking.
 */
export async function getR2UploadPresignedUrl({
  fileName,
  fileType,
  category = "documents",
  uploadedById,
  expiresInSeconds = 300,
}: {
  fileName: string;
  fileType?: string;
  category?: string;
  uploadedById?: string;
  expiresInSeconds?: number;
}) {
  const account = await selectActiveR2Account();
  const client = getR2Client(account);

  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const key = `${category}/${Date.now()}-${sanitizedFileName}`;

  const command = new PutObjectCommand({
    Bucket: account.bucketName,
    Key: key,
    ContentType: fileType || "application/octet-stream",
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  const publicUrl = account.publicUrl ? `${account.publicUrl.replace(/\/$/, "")}/${key}` : null;

  // Record initial file metadata in DB
  const storedFile = await prisma.storedFile.create({
    data: {
      accountId: account.id,
      bucket: account.bucketName,
      key,
      fileName,
      fileType,
      category,
      publicUrl,
      uploadedById,
    },
  });

  return {
    fileId: storedFile.id,
    uploadUrl,
    key,
    publicUrl,
    accountId: account.id,
  };
}

/**
 * Generate a pre-signed download URL for a file key or DB file ID.
 */
export async function getR2DownloadPresignedUrl(
  keyOrFileId: string,
  expiresInSeconds = 3600
): Promise<string> {
  const fileRecord = await prisma.storedFile.findFirst({
    where: {
      OR: [{ id: keyOrFileId }, { key: keyOrFileId }],
      deletedAt: null,
    },
  });

  const accounts = getR2Accounts();
  let targetAccount: R2AccountConfig | undefined;

  if (fileRecord) {
    targetAccount = accounts.find((a) => a.id === fileRecord.accountId);
  }

  // Fallback to first available account if not found in DB
  if (!targetAccount) {
    targetAccount = accounts[0];
  }

  if (!targetAccount) {
    throw new Error("No R2 account found to generate download URL.");
  }

  const client = getR2Client(targetAccount);
  const targetKey = fileRecord ? fileRecord.key : keyOrFileId;
  const targetBucket = fileRecord ? fileRecord.bucket : targetAccount.bucketName;

  const command = new GetObjectCommand({
    Bucket: targetBucket,
    Key: targetKey,
  });

  return await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

/**
 * Delete a file across multi-account pool and mark deleted in DB.
 */
export async function deleteFromR2(keyOrFileId: string) {
  const fileRecord = await prisma.storedFile.findFirst({
    where: {
      OR: [{ id: keyOrFileId }, { key: keyOrFileId }],
    },
  });

  const accounts = getR2Accounts();
  const targetAccount = fileRecord
    ? accounts.find((a) => a.id === fileRecord.accountId) || accounts[0]
    : accounts[0];

  if (!targetAccount) {
    throw new Error("No R2 account configured to perform deletion.");
  }

  const client = getR2Client(targetAccount);
  const targetKey = fileRecord ? fileRecord.key : keyOrFileId;
  const targetBucket = fileRecord ? fileRecord.bucket : targetAccount.bucketName;

  const command = new DeleteObjectCommand({
    Bucket: targetBucket,
    Key: targetKey,
  });

  await client.send(command);

  if (fileRecord) {
    await prisma.storedFile.update({
      where: { id: fileRecord.id },
      data: { deletedAt: new Date() },
    });
  }

  return { success: true, key: targetKey };
}
