const axios = require('axios');
const { t } = require('../lib/language');
const settings = require('../settings');

module.exports = async (sock, chatId, msg, args, commands, userLang) => {
    try {
        const url = args[0] || (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation);
        
        if (!url || !/twitter\.com|x\.com/.test(url)) {
            return await sock.sendMessage(chatId, { text: '❌ Please provide a valid Twitter/X link!' }, { quoted: msg });
        }

        await sock.sendMessage(chatId, { react: { text: '⏳', key: msg.key } });

        // Using a reliable download API
        const response = await axios.get(`https://api.vreden.web.id/api/twitter?url=${encodeURIComponent(url)}`);
        
        if (!response.data || !response.data.status) {
            throw new Error('Failed to fetch video from API');
        }

        const videoUrl = response.data.result.video_sd || response.data.result.video_hd || response.data.result.video;
        
        if (!videoUrl) {
            throw new Error('No video found in the response');
        }

        await sock.sendMessage(chatId, {
            video: { url: videoUrl },
            caption: `✅ *Twitter Downloader*\n\n👤 *User:* ${response.data.result.username || 'N/A'}\n📝 *Caption:* ${response.data.result.caption || 'No caption'}\n\n© ${settings.botName}`,
            mimetype: 'video/mp4'
        }, { quoted: msg });

        await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });

    } catch (error) {
        console.error('Error in twitter command:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to download Twitter video. Please try again later.' }, { quoted: msg });
        await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } });
    }
};
