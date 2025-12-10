# SamanKhojo Deployment Guide

## Frontend Deployment (Firebase) ✅ COMPLETED

Your frontend is successfully deployed to Firebase Hosting:
- **URL**: https://khojo-9ae5c.web.app
- **Status**: Live and accessible

## Backend Deployment (Render)

### Step 1: Prepare Your Repository

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

### Step 2: Deploy to Render

1. **Go to Render Dashboard**: https://render.com
2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select this repository

3. **Configure the Service**:
   - **Name**: `samankhojo-backend`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid for better performance)

4. **Set Environment Variables** in Render Dashboard:
   ```
   NODE_ENV=production
   PORT=10000
   FIREBASE_PROJECT_ID=khojo-9ae5c
   FIREBASE_PRIVATE_KEY_ID=8c24f4ae6b5b4fdf80f8109728135bfb7cbb1712
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCMT8boYebZtZpd\nQC27Hftd1+arCDu7Vpr9ktyZT+f/4sY2QI93Ipz+JEvhBuD18FcMY9hJx5ZOwTa9\nEJGoq6tSpFofgXVwmdwdnYe0GbDJeKQM/NbqeWdHqTFf0KydtLeCdlX7iOPnSnSv\nHJuBu/OERB+XzepjVRlU+2+x07kPrdpcsy5ZCgYHSNBOhkXWrBybuE03ISO0OY+r\nBOZUcFmeS0TY0sIaKJcGmVMtR4jtBD+nwDTWDmC4uEXW8iHJrqhkPLeO511VGUN+\n0Y4qF81F3lO7po/yb+y4DareU3lK6cTJJQJGoXPhsPZohXUe2/0Zkw1OSvPXM3Sx\n9RMqXiSRAgMBAAECggEABSlLGRG+3uvL+5mohP1PmY5fVRPGtLe1GFZOaJJUp6hF\nH8pErL54dW3K38JzxIA8h39lvaMKn6eCVraVERYNhYr3qLiHpCZ4vxskGocmZmba\nbALh+fqQxsVNxGdF7kAvTuyA8bGBpqipvaZI/x71kHw8CEbCFDjVZ3efTnSKFm5C\nCzC2vHDVj1oLTrtZg6SFvptwU+KsJ8UNP9XwwaGKNxCg5rIh4YAq+wNwFhJI+qsb\n5VGCw3UOYku1yydRHAgHCt03xMg/vncTz2ineXkgZAS1L4NFZCaZFsv5qbEhBEEc\nLBhJ9DTeFmdO7bnOTYRWZ2JNh/LUBo7VDQvewpeB1QKBgQDCS2+OuKkXGcTYDG8W\nmvYYq3d3C0946AgsqsTUcD+f4KRROb1fsIzJMKZLbeJsoAfv0nNP4Psu96I+iFyq\nz3sL39xhp7XOsLVGCbzZWt+KE5V0vokSj3OtKcLKoSbu+xUGp9iaGmbgEKlZQDdp\nuIFSGYgfKmi8NOUO1tUBjk35NQKBgQC432gbpCQV9bUsITUvEyRi6Z+Xq3y1xJrV\nFrCEMssXLYOzJ9PUcpOaUFfZGiznUPwlT7jULrqzdKvvKblNhp/rHCYTX9nrlvMo\nz7Ew7ug1e34vD1Tg7CijHv9aE03BhFsHbubUfPP0qRYgdYHjpmzw9N7lgxKCq4iN\nbM0Z3rkFbQKBgDCQZHD7DSC+CyqpaPbwgsTFzxWNWS7yaGCpyosDB5QxtUCsOv55\nBaegJmDCNY9LLNCv/Kyhoocp1H7m3KrBM5NTQCWUoufn2VeJRY/am/dKT9gfa+mc\nu6AzyQGW6EFhtu6z83sJUF9/KqUpXPBq8sAPq6uGkSlB22MrJZC+/hRlAoGAOvny\nMVc0t9ixmklhuQnHQtK6udzYJPh6WF4ro5C8n0FC0WV0O0Lt+X2F+NlT19tLBPAg\ny3e40cT3kI1j8upum8dYEjgywehe2/cd1LlyVJV31LV0Y2iTMi6SUX71ADYkAAQO\nGV1fSf6i82npLOGLwXasoNUmk477Ofqql4UoyyUCgYEAgnrCfgX9bhm1pMv1lkQd\nOCQlx5BNDpTFLBlxp1rd9i3LMPlyjoT3I8G7Mn1fuaquZRg12lbNd53nd0VuLdyi\nQmpsNTs6tOqFhEiWqShDKF0NWEn46rdAV+xPub4vIa6ijQZk82DgRKxDtvUlZGUD\npgILAGvsKWuhCwmIX03u48A=\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@khojo-9ae5c.iam.gserviceaccount.com
   FIREBASE_CLIENT_ID=108074671711661012472
   FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40khojo-9ae5c.iam.gserviceaccount.com
   FIREBASE_STORAGE_BUCKET=khojo-9ae5c.firebasestorage.app
   JWT_SECRET=SamanKhojo_Prod_JWT_Secret_2024_Secure_Key_Change_This_In_Production
   FREE_DAILY_LIMIT=1000
   BASE_WEB_URL=https://khojo-9ae5c.web.app
   ADMIN_EMAIL=amirhussain@gmail.com
   PRODUCT_ALERTS_ENABLED=true
   SEARCH_TRACKING_ENABLED=true
   NLU_TRAINING_ENABLED=true
   CUSTOM_NLU_MODEL_ENABLED=true
   ```

5. **Deploy**: Click "Create Web Service"

### Step 3: Update Frontend Configuration

Once your backend is deployed on Render (you'll get a URL like `https://samankhojo-backend.onrender.com`), update the frontend:

1. **Update .env.production**:
   ```bash
   VITE_API_BASE_URL=https://your-render-app-name.onrender.com
   ```

2. **Rebuild and redeploy frontend**:
   ```bash
   npm run build:prod
   firebase deploy --only hosting
   ```

### Step 4: Test the Deployment

1. **Backend Health Check**: Visit `https://your-render-app-name.onrender.com/health`
2. **Frontend**: Visit `https://khojo-9ae5c.web.app`
3. **Test API Connection**: Try searching or browsing shops

## Important Notes

### Security
- Never commit `.env` files to version control
- Use Render's environment variables for sensitive data
- The Firebase private key should be set as an environment variable in Render

### Performance
- Render free tier has limitations (sleeps after 15 minutes of inactivity)
- Consider upgrading to a paid plan for production use
- Monitor your app's performance and logs in Render dashboard

### Monitoring
- Check Render logs for any deployment issues
- Use the `/health` endpoint to monitor backend status
- Firebase hosting provides analytics and performance monitoring

## Troubleshooting

### Common Issues
1. **CORS Errors**: Ensure your Render URL is added to CORS configuration
2. **Environment Variables**: Double-check all required env vars are set in Render
3. **Build Failures**: Check Render logs for specific error messages
4. **Firebase Connection**: Verify Firebase credentials and project ID

### Support
- Render Documentation: https://render.com/docs
- Firebase Documentation: https://firebase.google.com/docs