-- DropForeignKey: AdminUser synthetic IDs (env-based login) don't exist in AdminUser table
ALTER TABLE IF EXISTS "CustomerRequest" DROP CONSTRAINT IF EXISTS "CustomerRequest_reviewedBy_AdminUser_id_fkey";
