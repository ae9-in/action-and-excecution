import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;

/**
 * Generates a signed upload signature for client-side Cloudinary uploads.
 * NEVER expose CLOUDINARY_API_SECRET to the client.
 */
export function generateUploadSignature(params: {
  orgSlug: string;
  businessSlug: string;
  categoryKey: string;
  fileId: string;
  resourceType: 'image' | 'video' | 'raw';
}) {
  const { orgSlug, businessSlug, categoryKey, fileId, resourceType } = params;
  const folder = `${orgSlug}/${businessSlug}/${categoryKey}`;
  const timestamp = Math.round(new Date().getTime() / 1000);

  const eagerTransforms =
    resourceType === 'image'
      ? 'w_400,c_fill,f_auto,q_auto'
      : resourceType === 'video'
      ? 'so_0,w_400,h_225,c_fill,f_jpg'
      : undefined;

  const paramsToSign: Record<string, string | number> = {
    folder,
    public_id: `${fileId}`,
    timestamp,
  };
  if (eagerTransforms) paramsToSign.eager = eagerTransforms;

  const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET!);

  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    folder,
    publicId: `${fileId}`,
    eager: eagerTransforms,
  };
}

/**
 * Soft-delete companion: hard-delete a Cloudinary asset by public_id.
 */
export async function deleteCloudinaryAsset(publicId: string, resourceType: 'image' | 'video' | 'raw') {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}
