# Deployment Guide

This guide outlines how to deploy the ReverseMarket application to production.

## 1. Supabase (Backend)
1. Log in to [Supabase](https://supabase.com).
2. Create a new project.
3. Open the **SQL Editor** in your Supabase dashboard and run the entire contents of `supabase/schema.sql`. This sets up:
   - All tables and enums.
   - Row Level Security (RLS) policies.
   - Triggers for user profile creation.
   - Initial seed data (categories).
4. Go to **Storage** and create two new buckets:
   - `avatars` (Make this bucket public).
   - `reference-files` (Keep this private/authenticated).
5. Add Storage Policies for both buckets allowing authenticated users to upload and view files as needed.
6. Under **Authentication** -> **Providers**, ensure Email is enabled. Turn off "Confirm email" if you don't want to set up an SMTP server immediately.

## 2. Vercel (Frontend)
1. Push your code to a GitHub repository.
2. Log in to [Vercel](https://vercel.com) and click **Add New** -> **Project**.
3. Import your GitHub repository.
4. Expand the **Environment Variables** section and add:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL (found in Supabase Settings -> API).
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Project Anon Key (found in Supabase Settings -> API).
5. Click **Deploy**.
6. Once deployed, Vercel will provide you with a production URL (e.g., `https://reversemarket.vercel.app`).

## 3. Post-Deployment Setup
1. In Supabase, go to **Authentication** -> **URL Configuration**.
2. Add your new Vercel production URL to the **Site URL** and **Redirect URLs** so that authentication redirects work properly in production.
