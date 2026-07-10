# Deployment validation

Railway must deploy the latest `main` commit. The previous failure referenced an older customer workspace query that filtered `SupportCase` by a non-existent `deletedAt` field. The current source no longer uses that filter in the included support cases query.
