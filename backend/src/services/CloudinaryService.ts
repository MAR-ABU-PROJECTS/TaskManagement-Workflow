import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse } from "cloudinary";
import type { Readable } from "stream";

export type CloudinaryResourceType = "image" | "video" | "raw" | "auto";

export interface CloudinarySignatureParams {
  folder: string;
  resourceType?: CloudinaryResourceType;
  publicId?: string;
  tags?: string[];
}

class CloudinaryService {
  private configured = false;

  constructor() {
    const cloudinaryUrl = process.env.CLOUDINARY_URL;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudinaryUrl) {
      cloudinary.config(cloudinaryUrl);
      this.configured = true;
      return;
    }

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      this.configured = true;
    }
  }

  isConfigured() {
    return this.configured;
  }

  getSignature(params: CloudinarySignatureParams) {
    if (!this.configured) {
      throw new Error("Cloudinary is not configured");
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const signatureParams: Record<string, string | number> = {
      timestamp,
      folder: params.folder,
    };

    if (params.publicId) {
      signatureParams.public_id = params.publicId;
    }

    if (params.resourceType) {
      signatureParams.resource_type = params.resourceType;
    }

    if (params.tags && params.tags.length > 0) {
      signatureParams.tags = params.tags.join(",");
    }

    const config = cloudinary.config();
    const signature = cloudinary.utils.api_sign_request(
      signatureParams,
      config.api_secret as string,
    );

    return {
      timestamp,
      signature,
      apiKey: config.api_key,
      cloudName: config.cloud_name,
      folder: params.folder,
      resourceType: params.resourceType || "auto",
    };
  }

  async uploadBuffer(
    file: Buffer,
    options: {
      folder: string;
      resourceType?: CloudinaryResourceType;
      publicId?: string;
      filename?: string;
      mimeType?: string;
    },
  ) {
    if (!this.configured) {
      throw new Error("Cloudinary is not configured");
    }

    const resourceType = options.resourceType || "auto";

    return new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          folder: options.folder,
          public_id: options.publicId,
          use_filename: Boolean(options.filename),
          filename_override: options.filename,
          unique_filename: true,
          overwrite: false,
          chunk_size: 20 * 1024 * 1024,
        },
        (error?: unknown, result?: UploadApiResponse) => {
          if (error || !result) {
            reject(error || new Error("Cloudinary upload failed"));
            return;
          }
          resolve(result);
        },
      );

      stream.end(file);
    });
  }

  async uploadStream(
    fileStream: Readable,
    options: {
      folder: string;
      resourceType?: CloudinaryResourceType;
      publicId?: string;
      filename?: string;
      mimeType?: string;
    },
  ) {
    if (!this.configured) {
      throw new Error("Cloudinary is not configured");
    }

    const resourceType = options.resourceType || "auto";

    return new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          folder: options.folder,
          public_id: options.publicId,
          use_filename: Boolean(options.filename),
          filename_override: options.filename,
          unique_filename: true,
          overwrite: false,
          chunk_size: 20 * 1024 * 1024,
        },
        (error?: unknown, result?: UploadApiResponse) => {
          if (error || !result) {
            reject(error || new Error("Cloudinary upload failed"));
            return;
          }
          resolve(result);
        },
      );

      fileStream.pipe(uploadStream);
    });
  }

  async deleteAsset(publicId: string, resourceType: CloudinaryResourceType) {
    if (!this.configured) {
      throw new Error("Cloudinary is not configured");
    }

    return cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType === "auto" ? "raw" : resourceType,
    });
  }
}

export default new CloudinaryService();
