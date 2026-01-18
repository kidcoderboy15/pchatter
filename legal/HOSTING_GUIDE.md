# Privacy Policy & Terms of Service Hosting Guide

This guide explains how to host your privacy policy and terms of service so you can use the URLs in your app.json configuration.

## Overview

iOS and Android app stores require publicly accessible URLs for:
- Privacy Policy
- Terms of Service (optional but recommended)

These must be **publicly accessible HTTPS URLs** that can be reviewed by Apple and Google during the app review process.

## Files to Host

In the `legal/` directory, you have:
- `privacy-policy.html` - Styled HTML version (recommended for web)
- `PRIVACY_POLICY.md` - Markdown version (for documentation)
- `terms-of-service.html` - Styled HTML version
- `TERMS_OF_SERVICE.md` - Markdown version

**Upload the .html files** to your web hosting.

## Hosting Options

### Option 1: GitHub Pages (Free, Easiest)

**Pros:** Free, automatic HTTPS, easy to update
**Cons:** Public repository required (or GitHub Pro for private repos)

#### Steps:

1. **Create a new repository** (or use existing):
```bash
# Option A: Create new public repo for legal docs
gh repo create pickle-chatter-legal --public

# Option B: Use your existing app repo
```

2. **Push legal files to gh-pages branch**:
```bash
cd /home/user/pchatter

# Create gh-pages branch
git checkout --orphan gh-pages
git rm -rf .
git clean -fdx

# Copy legal files
cp legal/privacy-policy.html index.html
cp legal/terms-of-service.html terms.html

# Commit and push
git add .
git commit -m "Add legal documents"
git push origin gh-pages

# Return to main branch
git checkout main
```

3. **Enable GitHub Pages**:
- Go to your repo → Settings → Pages
- Source: Deploy from branch `gh-pages`
- Click Save

4. **Your URLs will be**:
```
https://yourusername.github.io/pickle-chatter-legal/
https://yourusername.github.io/pickle-chatter-legal/terms.html
```

5. **Update app.json**:
```json
{
  "expo": {
    "ios": {
      "config": {
        "privacyPolicyUrl": "https://yourusername.github.io/pickle-chatter-legal/",
        "termsOfServiceUrl": "https://yourusername.github.io/pickle-chatter-legal/terms.html"
      }
    }
  }
}
```

### Option 2: Netlify (Free, Professional)

**Pros:** Free, custom domain, automatic deployments, drag-and-drop
**Cons:** Requires Netlify account

#### Steps:

1. **Create account** at https://netlify.com

2. **Create a new site**:
   - Click "Add new site" → "Deploy manually"
   - Drag the `legal/` folder into the upload area
   - Or connect your GitHub repo for automatic deployments

3. **Configure**:
   - Site name: `pickle-chatter-legal`
   - Rename files: `privacy-policy.html` → `index.html`

4. **Your URLs**:
```
https://pickle-chatter-legal.netlify.app/
https://pickle-chatter-legal.netlify.app/terms-of-service.html
```

5. **(Optional) Custom domain**:
   - Buy domain: `picklechatter.com`
   - Add to Netlify: Site settings → Domain management
   - URLs become:
     - `https://picklechatter.com/privacy`
     - `https://picklechatter.com/terms`

### Option 3: Vercel (Free, Fast)

**Pros:** Free, fast, GitHub integration
**Cons:** Requires Vercel account

#### Steps:

1. **Create account** at https://vercel.com

2. **Install Vercel CLI**:
```bash
npm install -g vercel
```

3. **Deploy**:
```bash
cd /home/user/pchatter/legal
vercel deploy
# Follow prompts
```

4. **Your URLs**:
```
https://pickle-chatter-legal.vercel.app/privacy-policy.html
https://pickle-chatter-legal.vercel.app/terms-of-service.html
```

### Option 4: Firebase Hosting (Free, Google)

**Pros:** Free, reliable, Google infrastructure
**Cons:** Requires Google account and Firebase setup

#### Steps:

1. **Install Firebase CLI**:
```bash
npm install -g firebase-tools
firebase login
```

2. **Initialize hosting**:
```bash
cd /home/user/pchatter
firebase init hosting

# Choose:
# - Create new project or use existing
# - Public directory: legal
# - Single-page app: No
# - GitHub deploys: Optional
```

3. **Deploy**:
```bash
firebase deploy --only hosting
```

4. **Your URLs**:
```
https://your-project.web.app/privacy-policy.html
https://your-project.web.app/terms-of-service.html
```

### Option 5: AWS S3 + CloudFront (Professional, Paid)

**Pros:** Scalable, professional, custom domain
**Cons:** Requires AWS account, more complex, costs money

#### Steps:

1. **Create S3 bucket**:
   - Name: `pickle-chatter-legal`
   - Enable static website hosting
   - Public read access

2. **Upload files**:
```bash
aws s3 cp legal/privacy-policy.html s3://pickle-chatter-legal/index.html --acl public-read
aws s3 cp legal/terms-of-service.html s3://pickle-chatter-legal/terms.html --acl public-read
```

3. **Set up CloudFront** (for HTTPS):
   - Create distribution
   - Origin: Your S3 bucket
   - SSL certificate: AWS-provided or custom

4. **Your URLs**:
```
https://d1234abcd.cloudfront.net/
https://d1234abcd.cloudfront.net/terms.html
```

### Option 6: Your Own Web Server

If you have existing web hosting:

1. **Upload via FTP/SFTP**:
   - Upload `privacy-policy.html` to `public_html/privacy/index.html`
   - Upload `terms-of-service.html` to `public_html/terms/index.html`

2. **Ensure HTTPS is enabled** (required by app stores)

3. **Your URLs**:
```
https://yourdomain.com/privacy/
https://yourdomain.com/terms/
```

## Recommended Setup

**For Quick Testing / Beta:**
- Use **GitHub Pages** (free, 5 minutes setup)

**For Production Launch:**
- Use **Netlify** or **Vercel** with custom domain
- Example: `https://picklechatter.com/privacy`

**For Large Scale / Enterprise:**
- Use **AWS S3 + CloudFront** with custom domain

## Custom Domain Setup (Optional)

If you want professional URLs like `https://picklechatter.com/privacy`:

1. **Buy domain**: Namecheap, Google Domains, Cloudflare ($10-15/year)

2. **Point DNS to hosting**:

**GitHub Pages:**
```
Type: CNAME
Name: www
Value: yourusername.github.io
```

**Netlify:**
```
Type: CNAME  
Name: @
Value: your-site.netlify.app
```

3. **Configure SSL** (automatic with most hosts)

4. **Update app.json** with your custom domain URLs

## URL Requirements

Your hosted privacy policy must:
- ✅ Be publicly accessible (no login required)
- ✅ Use HTTPS (not HTTP)
- ✅ Load quickly (< 3 seconds)
- ✅ Be mobile-friendly
- ✅ Not redirect to third-party sites
- ✅ Match the version in your app submission

## Update app.json

Once hosted, update `/home/user/pchatter/app.json`:

```json
{
  "expo": {
    "name": "Pickle Chatter",
    "ios": {
      "infoPlist": {
        "NSCameraUsageDescription": "Pickle Chatter needs camera access to scan QR codes for joining games and groups.",
        "NSPhotoLibraryUsageDescription": "Pickle Chatter needs photo library access to let you choose a profile picture.",
        "NSLocationWhenInUseUsageDescription": "Pickle Chatter uses your location to show nearby courts and games."
      },
      "config": {
        "usesNonExemptEncryption": false
      }
    },
    "extra": {
      "privacyPolicyUrl": "https://YOUR-DOMAIN/privacy-policy.html",
      "termsOfServiceUrl": "https://YOUR-DOMAIN/terms-of-service.html"
    }
  }
}
```

## Testing Your URLs

Before submitting to app stores, verify:

```bash
# Check URL is accessible
curl -I https://your-domain/privacy-policy.html

# Should return:
# HTTP/2 200 
# content-type: text/html

# Check in browser
open https://your-domain/privacy-policy.html

# Validate mobile-friendly
# Use: https://search.google.com/test/mobile-friendly
```

## In-App Display

You can also display the privacy policy within the app:

```typescript
// src/screens/auth/PrivacyPolicyScreen.tsx
import { WebView } from 'react-native-webview';

export const PrivacyPolicyScreen = () => {
  return (
    <WebView 
      source={{ uri: 'https://your-domain/privacy-policy.html' }}
      style={{ flex: 1 }}
    />
  );
};
```

## Version Control

When updating legal documents:

1. **Update source files** in `legal/` directory
2. **Commit to git** with clear message
3. **Redeploy** to hosting
4. **Update app** if material changes require user notification
5. **Update "Last Updated" date** in the document

```bash
git add legal/
git commit -m "docs: Update privacy policy - add push notification section"
git push

# Then redeploy to hosting
vercel deploy --prod
# or
firebase deploy --only hosting
# or
git push origin gh-pages
```

## Troubleshooting

**"URL not accessible"**
- Check HTTPS is enabled
- Verify file was uploaded correctly
- Check DNS propagation (can take 24-48 hours)
- Try incognito mode to bypass cache

**"App Store rejects privacy policy URL"**
- Must be HTTPS (not HTTP)
- Must load without authentication
- Must be mobile-friendly
- Must be in English (or app's primary language)
- Must not redirect multiple times

**"Changes not showing"**
- Clear browser cache
- Check deployment succeeded
- Verify correct file was uploaded
- Wait for CDN cache to clear (5-15 minutes)

## Next Steps

1. ✅ Choose hosting option (recommend Netlify for production)
2. ✅ Upload `privacy-policy.html` and `terms-of-service.html`
3. ✅ Get public HTTPS URLs
4. ✅ Update `app.json` with your URLs
5. ✅ Test URLs in browser (desktop and mobile)
6. ✅ Commit updated `app.json`
7. ✅ Proceed with app store submission

## Legal Disclaimer

**Important:** These templates are starting points. You should:
- Review with a lawyer before publishing
- Customize for your specific data practices
- Update as features or data practices change
- Consider jurisdiction-specific requirements (GDPR, CCPA, etc.)

For legal review, consult:
- Startup lawyer specializing in tech/mobile apps
- Legal services: Rocket Lawyer, LegalZoom
- Privacy law specialist for GDPR/CCPA compliance
