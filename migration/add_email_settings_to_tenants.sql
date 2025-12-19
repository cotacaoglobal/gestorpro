-- Migration: Add email notification settings to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT TRUE;

-- Update existing tenants to have the column set to TRUE if needed (though DEFAULT TRUE handles this for new columns)
UPDATE tenants SET email_notifications_enabled = TRUE WHERE email_notifications_enabled IS NULL;
