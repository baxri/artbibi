# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

ETHER SCAN API KEY: FRA9DM7T7U1RHUBBRJ3A3MP8B2MMH2Q73S

Try running some of the following tasks:

```shell
npx hardhat typechain

npx hardhat vars set PRIVATE_KEY
npx hardhat vars set INFURA_API_KEY

npx hardhat vars list
npx hardhat vars delete PRIVATE_KEY

npx hardhat ignition deploy ./ignition/modules/Lock.ts --network localhost

npx hardhat ignition deploy ./ignition/modules/NFTCollection/ProxyModule.ts --network polygon --verify
npx hardhat ignition deploy ./ignition/modules/SocialMediaVerification/ProxyModule.ts --network polygon --verify


npx hardhat ignition deploy ./ignition/modules/NFTCollection/UpgradeModule.ts --network polygon --verify
npx hardhat ignition verify chain-137 --include-unrelated-contracts



npx hardhat test
npx hardhat compile
npx hardhat node



# https://app.pinata.cloud/ipfs/files

# https://opensea.io/collection/mr-artbibi
# https://polygonscan.com/address/0x7ad3dbeb69eb2b80f4182f96c94cbea4de267e9c
```

# Flow for the frontend application

1. User connects their wallet
2. Show the user the list of social media platforms which are already verified and the add button to add new one

3. When you click on add button, User selects a social media platform and enters their username
4. User clicks on the "Verify" button gets the verification request id
5. User is redirected to the social media platform to confirm the verification
6. User is redirected back to the frontend application
7. User can now see the verified status of their account

Instagram URLS:

// Configuration URL
// https://developers.facebook.com/apps/1634819440405692/dashboard/

https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=1952722025237124&redirect_uri=https://www.myauto.ge/ka/&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish

https://www.myauto.ge/ka/?code=AQBb-J_G1GsIaosXyvqFmDq9S3aTauP3y395LAEqW8A4CssMlzrbRLeNHIpD0UJT-Zyd2I5lt_9tKem1tYrL5qZeinyxthBUyKeQ5Ab7mtEAT3ym1ckT0G-TsktjvPSn4GztzGgLlQMj0TDToDaYS4y9_8bECEXvGYrYWLr4Ry9YIE_GXAKbeHsKHlspUL_X8cJCH1S4wL782kt4tsF1Tnc-1askOwg2zueexHnFICnUkA#_

https://www.myauto.ge/ka/?code=AQC90F_YvnHqgT88jnMn-kl8XXVtu4EbHB8I8bk3P9XwKBk-7IvZpViUCxxbnVJxHVs6I_m-muUpzxvMZZO7BiaVNUh7Toqnz_zwc0pyKUmokIB6QybP_Xmtd05uzV_CNXiRsxRvviIuxPfav2qW2Qz_LR-8dq3-WJIczCWGjfWQ_bP2RUU1FJ78yQRCAzwsC03X6p4CSUBmeMRPa2NfKOwbz9NOEgfCLRIfsTPzZF4BSQ#_

```javascript
// Exchange code to get the access token
const tokenResponse = await axios.post(
  "https://api.instagram.com/oauth/access_token",
  new URLSearchParams({
    client_id: process.env.INSTAGRAM_CLIENT_ID,
    client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
    grant_type: "authorization_code",
    redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
    code,
  })
);

const { access_token } = tokenResponse.data;

// Fetch the username using the access token
const userResponse = await axios.get(
  `https://graph.instagram.com/me?fields=id,username&access_token=${access_token}`
);

const { username } = userResponse.data;
```

```
Possible improvements:
2) Add more events confirm verification failuire for debuging + 
3) Add post hash in post object to show them in the frontend list
4) Add function to show all posts in the system (to be used like on a media scan page)
5) We should include username as well in list of posts
```
