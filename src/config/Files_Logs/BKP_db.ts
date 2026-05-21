import pg from "pg";
const { Pool } = pg;


const db = new Pool({
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "1234",
    database: "acessos",
});

export default db;