import { prisma } from "../config/prisma.js";
export const audit = ({ req, action, entityType, entityId, before, after }, tx = prisma) => tx.adminAuditLog.create({ data: { actorId: req.user.id, action, entityType, entityId, before, after, ipAddress: req.ip } });
