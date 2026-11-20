import "server-only";
import { randomUUID } from "node:crypto";
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Bucket privado de Cloudflare R2 (API compatible con S3).
// Los archivos nunca son públicos: se sirven con URLs firmadas que caducan.
let client: S3Client | undefined;

function r2() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Faltan R2_ACCOUNT_ID, R2_ACCESS_KEY_ID o R2_SECRET_ACCESS_KEY en .env");
  }
  client ??= new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    // R2 no admite los checksums opcionales que el SDK de AWS agrega por defecto.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return client;
}

const bucket = () => {
  const b = process.env.R2_BUCKET;
  if (!b) throw new Error("Falta R2_BUCKET en .env");
  return b;
};

/** Sube un archivo y devuelve su clave (por ejemplo "covers/<uuid>-foto.png"). */
export async function uploadFile(file: File | Blob, folder: string, name = "file") {
  const safe = name.replace(/[^\w.\-]+/g, "_");
  const key = `${folder}/${randomUUID()}-${safe}`;
  await r2().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type || "application/octet-stream",
    })
  );
  return key;
}

export async function deleteFiles(keys: (string | null | undefined)[]) {
  // Las claves que empiezan con "http" son enlaces externos, no archivos de R2.
  const objects = keys.filter((k): k is string => !!k && !k.startsWith("http")).map((Key) => ({ Key }));
  if (!objects.length) return;
  await r2().send(new DeleteObjectsCommand({ Bucket: bucket(), Delete: { Objects: objects } }));
}

/** URL firmada de lectura (por defecto 1 h). La firma se calcula en local, sin llamadas de red. */
export function signedUrl(key: string, expiresIn = 3600) {
  return getSignedUrl(r2(), new GetObjectCommand({ Bucket: bucket(), Key: key }), { expiresIn });
}
