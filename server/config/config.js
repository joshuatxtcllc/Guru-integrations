
module.exports = {
  dialogflow: {
    projectId: process.env.DIALOGFLOW_PROJECT_ID,
    clientEmail: process.env.DIALOGFLOW_CLIENT_EMAIL,
    privateKey: process.env.DIALOGFLOW_PRIVATE_KEY,
  },
  vendors: {
    frameDestination: {
      apiUrl: process.env.FRAME_DEST_API_URL,
      apiKey: process.env.FRAME_DEST_API_KEY,
      account: process.env.FRAME_DEST_ACCOUNT,
      active: process.env.FRAME_DEST_ACTIVE === 'true'
    },
    frameItEasy: {
      apiUrl: process.env.FRAME_IT_EASY_API_URL,
      apiKey: process.env.FRAME_IT_EASY_API_KEY,
      partnerId: process.env.FRAME_IT_EASY_PARTNER_ID,
      active: process.env.FRAME_IT_EASY_ACTIVE === 'true'
    }
  }
};
