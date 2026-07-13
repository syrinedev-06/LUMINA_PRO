const https = require('https');
const fs = require('fs');

const url = "https://cdn.dribbble.com/userupload/45029203/file/98e237d075e191ef94eceb770f972bd7.png";
const dest = "dribbble_ref.png";

const file = fs.createWriteStream(dest);
https.get(url, (response) => {
  response.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log("Download completed");
  });
}).on('error', (err) => {
  fs.unlink(dest, () => {});
  console.error("Error downloading:", err.message);
});
