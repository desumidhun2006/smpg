const express = require('express');
const router = express.Router();

const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const REDIRECT_URI = 'http://localhost:5001/api/instagram/callback';
const FRONTEND_URI = 'http://localhost:3000';

router.get('/auth', (req, res) => {
  const scopes = 'public_profile,pages_show_list,pages_manage_posts';
  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scopes)}&response_type=code`;
  res.redirect(authUrl);
});

router.get('/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    res.send(`<script>window.opener.postMessage({error:"${error}"}, "${FRONTEND_URI}");window.close();</script>`);
    return;
  }

  try {
    const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${INSTAGRAM_APP_ID}&client_secret=${INSTAGRAM_APP_SECRET}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&code=${code}`);

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      res.send(`<script>window.opener.postMessage({error:"${tokenData.error.message}"}, "${FRONTEND_URI}");window.close();</script>`);
      return;
    }

    const shortToken = tokenData.access_token;

    const longTokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${INSTAGRAM_APP_ID}&client_secret=${INSTAGRAM_APP_SECRET}&fb_exchange_token=${shortToken}`);
    const longTokenData = await longTokenRes.json();
    const accessToken = longTokenData.access_token || shortToken;

    const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`);
    const pagesData = await pagesRes.json();

    if (!pagesData.data || pagesData.data.length === 0) {
      res.send(`<script>window.opener.postMessage({error:"No Facebook Pages found. Please connect an Instagram Business account to a Facebook Page first."}, "${FRONTEND_URI}");window.close();</script>`);
      return;
    }

    const page = pagesData.data[0];

    const igRes = await fetch(`https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${accessToken}`);
    const igData = await igRes.json();

    if (!igData.instagram_business_account) {
      res.send(`<script>window.opener.postMessage({error:"No Instagram Business account connected to this page. Please connect one in Facebook Page settings."}, "${FRONTEND_URI}");window.close();</script>`);
      return;
    }

    const profileRes = await fetch(`https://graph.facebook.com/v19.0/me?fields=name,id&access_token=${accessToken}`);
    const profile = await profileRes.json();

    const data = {
      accessToken,
      user: {
        name: profile.name,
        id: profile.id,
        igAccountId: igData.instagram_business_account.id,
        pageId: page.id,
        pageName: page.name,
      },
    };

    res.send(`<script>window.opener.postMessage(${JSON.stringify(data)}, "${FRONTEND_URI}");window.close();</script>`);
  } catch (err) {
    res.send(`<script>window.opener.postMessage({error:"${err.message}"}, "${FRONTEND_URI}");window.close();</script>`);
  }
});

router.post('/post', async (req, res) => {
  const { caption, accessToken, igAccountId, images } = req.body;

  if (!caption || !accessToken || !igAccountId) {
    return res.status(400).json({ error: 'caption, accessToken, and igAccountId are required' });
  }

  try {
    if (images && images.length > 0) {
      const containerRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: `data:image/jpeg;base64,${images[0]}`,
          caption,
          access_token: accessToken,
        }),
      });

      const containerData = await containerRes.json();

      if (containerData.error) {
        return res.status(400).json({ error: containerData.error.message });
      }

      const publishRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: containerData.id,
          access_token: accessToken,
        }),
      });

      const publishData = await publishRes.json();

      if (publishData.error) {
        return res.status(400).json({ error: publishData.error.message });
      }

      res.json({ success: true, mediaId: publishData.id });
    } else {
      return res.status(400).json({ error: 'Instagram requires at least one image to post' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
