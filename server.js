import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));

app.post('/upload', upload.single('csvfile'), (req, res) => {
  const results = [];
  const filePath = req.file.path;
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      fs.unlinkSync(filePath); // Clean up uploaded file
      res.json({ rows: results });
    });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
