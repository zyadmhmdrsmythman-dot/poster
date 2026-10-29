import ImageKit from "imagekit";

// or


var imagekit = new ImageKit({
publicKey : process.env.IMAGEKIT_PUBLIC_KEY || "public_ZP//NqCKzfnNzrA7iwlF/eHwl3o=",
privateKey : process.env.IMAGEKIT_PRIVATE_KEY || "private_gzgkxlxS27+2XS7CbD1Wa6GrySE=",
urlEndpoint : process.env.IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/poster"
}); 

export default imagekit