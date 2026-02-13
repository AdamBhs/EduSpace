import AWS from "aws-sdk";
import { ManagedUpload } from "aws-sdk/clients/s3";

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export const uploadFile = (
  file: Express.Multer.File,
  key: string,
): Promise<string> => {
  const params: AWS.S3.PutObjectRequest = {
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: "public-read",
  };

  return new Promise((resolve, reject) => {
    s3.upload(params, (err: Error, data: ManagedUpload.SendData) => {
      if (err) return reject(err);

      return resolve(data.Location); // return the public URL
    });
  });
};
