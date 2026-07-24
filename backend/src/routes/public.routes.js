import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { ok } from "../utils/response.js";
export const publicRouter=Router();
publicRouter.get("/settings/public",async(_req,res)=>{const s=await prisma.systemSetting.upsert({where:{id:1},update:{},create:{id:1}});return ok(res,{libraryName:s.libraryName,logoUrl:s.logoUrl,defaultTheme:s.defaultTheme,allowThemeChange:s.allowThemeChange})});
publicRouter.get("/categories",async(_req,res)=>ok(res,await prisma.category.findMany({orderBy:{name:"asc"}})));
