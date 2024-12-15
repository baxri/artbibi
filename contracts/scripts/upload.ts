const { PinataSDK } = require("pinata");
const fs = require("fs");
const path = require("path");
const fetchNew = require("node-fetch"); // Ensure node-fetch is installed
const FormDataNew = require("form-data");

require("dotenv").config();

const pinataClient = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: "teal-total-pony-174.mypinata.cloud",
});

const metadataDir = path.join(__dirname, "../assets/metadata");
const imagesDir = path.join(__dirname, "../assets/images");
const files = fs.readdirSync(metadataDir);
const images = fs.readdirSync(imagesDir);


async function uploadFIle(file: any) {
  const form = new FormDataNew();
  const filePath = path.join(metadataDir, file);
  form.append("file", fs.createReadStream(filePath));
  const options = {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.PINATA_JWT,
      ...form.getHeaders(),
    },
    body: form,
  };

  const response = await fetchNew(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    options
  );
  const json = await response.json();
  const IpfsHash = json?.IpfsHash;

  return IpfsHash;
}

async function uploadMetaData() {
  for (const file of files) {
    const fileHash = await uploadFIle(file);

    console.log("fileHash", fileHash);
  }
}

uploadMetaData();
