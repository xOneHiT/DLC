import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import xlsx from 'xlsx';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { connectToDatabase, insertData, getData, getNextThreeRows, getNextRow, saveDataToDatabase } from './dbService.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);

  connectToDatabase()
    .then(() => {
      console.log('Database connection successful');
    })
    .catch(err => {
      console.error('Error occurred with MySQL connection:', err); // Optionally exit if the database connection fails
    });
});

app.post('/upload', async (req, res) => {
  try {
    const data = req.body;
    await insertData(data);
    res.send({ message: 'Data inserted successfully' });
  } catch (error) {
    console.error('Error inserting data:', error);
    res.status(500).send({ error: 'Server error, unable to insert data' });
  }
});

function formatData(data) {
  return data.map(item => {
    return { ...item };
  });
};

app.get('/download', async (req, res) => {
  try {
    let results = await getData();
    results = formatData(results);
    const worksheet = xlsx.utils.json_to_sheet(results);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1');


    const filePath = path.join(__dirname, 'data.xlsx');
    xlsx.writeFile(workbook, filePath);

    res.download(filePath, 'data.xlsx', (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        return;
      }
      fs.unlinkSync(filePath); //delete the file after sending it
    });
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).send('Error executing query');
  }
});


app.get('/api/next-three-rows', async (req, res) => {
  try {
    const startIndex = parseInt(req.query.startIndex, 10);
    const nextRows = await getNextThreeRows(startIndex);
    res.json(nextRows);
  } catch (error) {
    console.error('Error fetching next three rows:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/next-row', async (req, res) => {
  try {
    const nextRow = await getNextRow();
    res.json(nextRow);
  } catch (error) {
    console.error('Error fetching next row:', error);
    res.status(500).send({ error: 'Server error, unable to fetch next row' });
  }
});

app.post('/save-data', async (req, res) => {
  try {
    const dataToSave = req.body;
    await saveDataToDatabase(dataToSave);
    res.status(200).json({ message: 'Data saved successfully' });
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({ message: 'Failed to save data' });
  }
});
