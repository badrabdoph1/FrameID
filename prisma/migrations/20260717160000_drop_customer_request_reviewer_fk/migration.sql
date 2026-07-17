-- DropForeignKey: AdminUser synthetic IDs (env-based login) don't exist in AdminUser table
ALTER TABLE "CustomerRequest" DROP CONSTRAINT "CustomerRequest_reviewedBy_AdminUser_id_fkey";
