const express = require('express');
const app = express();
const multer = require('multer');

const PORT = 3000;

const upload = multer({ dest: './public/data/uploads/' });

app.use('/', express.static('public'));

app.post('/upload', upload.single('uploaded_file'), (req, res) => {
  res.sendStatus(200);
})

app.get('/bruh', (req, res) => res.json({ message: 'bruh' }));

app.listen(PORT, () => console.log(`multer example listening on ${PORT}!`));
