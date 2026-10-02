import 'dotenv/config'; import { createDb, seedDemoData } from './db.js'; import { makeApp } from './app.js';
const port=process.env.PORT||3001; const db=createDb(); if (process.env.SEED_DEMO_DATA !== 'false') seedDemoData(db); makeApp(db).listen(port,()=>console.info(`Expense API listening on ${port}`));
