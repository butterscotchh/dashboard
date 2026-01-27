# Vercel Deployment Guide

## 1. Login ke Vercel
https://vercel.com

## 2. New Project → Import GitHub Repo
Repository: bank-branch-dashboard

## 3. Configure:
- Framework: Other
- Root Directory: . 
- Build Command: (auto from vercel.json)
- Output Directory: (auto from vercel.json)

## 4. Environment Variables:
DB_HOST=sql.freedb.tech
DB_PORT=3306
DB_USER=freedb_gondezzz
DB_PASSWORD=!*864k$WAkMyeR5
DB_NAME=freedb_bank_branch_db
JWT_SECRET=ayam_kampus
NODE_ENV=production

## 5. Deploy!
Wait 3-5 minutes

## 6. Test:
https://bank-branch-dashboard.vercel.app/api/health
https://bank-branch-dashboard.vercel.app