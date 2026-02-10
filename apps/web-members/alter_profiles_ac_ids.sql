-- Add ActiveCampaign IDs to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS ac_contact_id text,
ADD COLUMN IF NOT EXISTS ac_customer_id text;
