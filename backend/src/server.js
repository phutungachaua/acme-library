import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { startJobs } from "./jobs/overdue.job.js";
const server=app.listen(env.PORT,()=>{console.log(`Acme Library API running on http://localhost:${env.PORT}`);startJobs()});
const shutdown=async()=>{server.close();await prisma.$disconnect();process.exit(0)};process.on("SIGTERM",shutdown);process.on("SIGINT",shutdown);
