import { createPool } from 'mysql2/promise';
import { config } from 'dotenv';
config();

const pool = createPool({
  port: process.env.MYSQL_PORT,
  password: process.env.MYSQL_PASSWORD,
  host: process.env.MYSQL_HOST,
  database: process.env.MYSQL_DATABASE_NAME,
  user: process.env.MYSQL_USER,
});

const query = async (sql, values) => {
  const [results] = await pool.query(sql, values);
  return results;
};

const connectToDatabase = async () => {
  try {
    await pool.getConnection();
  } catch (error) {
    console.log('Database Connection Error');
    console.log(error);
    throw error;
  }
};

const insertData = async (data) => {
  const sql = 'INSERT INTO readd (locationid, photo1, photo2, photo3, photo4, num_of_coca_cola_inside, num_of_pepsi_fridges_inside, others_inside, others_outside) VALUES ?';
  const values = data.map(row => [
    row.locationid,
    row.photo1,
    row.photo2,
    row.photo3,
    row.photo4,
    row.num_of_coca_cola_inside,
    row.num_of_pepsi_fridges_inside,
    row.others_inside,
    row.others_outside,
  ]);

  await query(sql, [values]);
  console.log('Data inserted successfully');
};


const getData = async () => {
  try {
    const [rows] = await pool.query('SELECT * FROM readd');
    return rows;
  } catch (error) {
    throw new Error(`Error executing query: ${error.message}`);
  }
};

const getNextThreeRows = async (startIndex) => {
  const sql = 'SELECT photo1, photo2, photo3, photo4, num_of_coca_cola_inside, num_of_pepsi_fridges_inside, others_inside, others_outside FROM readd LIMIT 3 OFFSET ?';
  const values = [startIndex];
  const rows = await query(sql, values);
  return rows;
};

let currentIndex = 0;
const getNextRow = async () => {
    const sql = 'SELECT locationid FROM readd LIMIT 1 OFFSET ?';
    const result = await query(sql, [currentIndex]);
    currentIndex += 1;
    return result[0];
};

let currentCounter = 1; // do NOT touch this variable
const saveDataToDatabase = async (data) => {

  for (const item of data) {
    const { cocaColaTF, pepsiTF, othersInsideTF, othersOutsideTF } = item;
    const selectQuery = `SELECT * FROM readd ORDER BY counter LIMIT 1`;

    try {
      const [rows] = await pool.query(selectQuery);

      const updateQueries = rows.map(() => {
        const updateQuery = `UPDATE readd SET cocaColaTF = ?, pepsiTF = ?, othersInsideTF = ?, othersOutsideTF = ? WHERE counter = ?`;
        const updateValues = [cocaColaTF, pepsiTF, othersInsideTF, othersOutsideTF, currentCounter];

        currentCounter++;
        return { query: updateQuery, values: updateValues };
      });

      for (const { query, values } of updateQueries) {
        await pool.query(query, values);
        console.log("The values are:", values);
        console.log('Data updated successfully!');
      }
    } catch (err) {
      console.error('Error running query:', err);
    }
  }
};





export {
  connectToDatabase,
  insertData,
  getData,
  getNextThreeRows,
  getNextRow,
  saveDataToDatabase
};
