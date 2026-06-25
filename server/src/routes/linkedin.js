const express = require('express');
const router = express.Router();

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:5001/api/linkedin/callback';
const FRONTEND_URI = 'http://localhost:3000';

router.get('/auth', (req, res) => {
  const scopes = 'w_member_social openid profile email';
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scopes)}&state=smpg`;
  res.redirect(authUrl);
});

router.get('/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    res.send(`<script>window.opener.postMessage({error:"${error}"}, "${FRONTEND_URI}");window.close();</script>`);
    return;
  }

  try {
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET,
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      res.send(`<script>window.opener.postMessage({error:"${tokenData.error_description}"}, "${FRONTEND_URI}");window.close();</script>`);
      return;
    }

    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();

    const data = {
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in,
      user: {
        sub: profile.sub,
        name: profile.name,
        picture: profile.picture,
      },
    };

    res.send(`<script>window.opener.postMessage(${JSON.stringify(data)}, "${FRONTEND_URI}");window.close();</script>`);
  } catch (err) {
    res.send(`<script>window.opener.postMessage({error:"${err.message}"}, "${FRONTEND_URI}");window.close();</script>`);
  }
});

async function uploadImageToLinkedIn(personId, imageBase64, accessToken) {
  const registerRes = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
        owner: `urn:li:person:${personId}`,
        serviceRelationships: [{
          relationshipType: 'OWNER',
          identifier: 'urn:li:userGeneratedContent',
        }],
      },
    }),
  });

  const registerData = await registerRes.json();
  const uploadUrl = registerData.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
  const asset = registerData.value.asset;

  const imageBuffer = Buffer.from(imageBase64, 'base64');

  await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/octet-stream',
    },
    body: imageBuffer,
  });

  return asset;
}

router.post('/post', async (req, res) => {
  const { content, accessToken, images } = req.body;

  if (!content || !accessToken) {
    return res.status(400).json({ error: 'content and accessToken are required' });
  }

  try {
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profile = await profileRes.json();

    if (!profile.sub) {
      return res.status(401).json({ error: 'Invalid access token' });
    }

    const postBody = {
      author: `urn:li:person:${profile.sub}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: content },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    if (images && images.length > 0) {
      const imageUrns = [];
      for (const img of images.slice(0, 9)) {
        try {
          const urn = await uploadImageToLinkedIn(profile.sub, img, accessToken);
          imageUrns.push(urn);
        } catch (err) {
          console.error('Image upload failed:', err.message);
        }
      }

      if (imageUrns.length > 0) {
        postBody.specificContent['com.linkedin.ugc.ShareContent'].media = imageUrns.map(urn => ({
          status: 'READY',
          media: urn,
        }));
        postBody.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'IMAGE';
      }
    }

    const postRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(postBody),
    });

    const postData = await postRes.json();

    if (!postRes.ok) {
      return res.status(postRes.status).json({ error: postData.message || 'LinkedIn post failed' });
    }

    res.json({ success: true, postId: postData.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
