const axios = require('axios');
const fs = require('fs');
const { sendWithChannelButton } = require('../lib/channelButton');
const settings = require('../settings');
const { t } = require('../lib/language');
const { canDownload, incrementDownload, DAILY_LIMIT } = require('../lib/apkLimiter');

async function apkCommand(sock, chatId, message, args, commands, userLang) {
    const query = args.join(' ').trim();
    const senderId = message.key.participant || message.key.remoteJid;

    // Check daily limit FIRST
    const limitCheck = canDownload(senderId);
    if (!limitCheck.allowed) {
        const limitMsg = t('apk.limit_reached', { limit: DAILY_LIMIT }, userLang);
        return await sendWithChannelButton(sock, chatId, limitMsg, message);
    }


    if (!query) {
        const helpMsg = t('apk.help', {
            prefix: settings.prefix,
            remaining: limitCheck.remaining,
            limit: DAILY_LIMIT
        }, userLang);

        return await sendWithChannelButton(sock, chatId, helpMsg, message);
    }
    // Handle MediaFire links specifically as they have a separate command
    if (query.startsWith('http')) {
        if (query.includes('mediafire.com')) {
            const mfireMsg = t('apk.mediafire_hint', { prefix: settings.prefix }, userLang);
            return await sendWithChannelButton(sock, chatId, mfireMsg, message);
        }
    }


    try {
        // Step 1: React with search icon
        await sock.sendMessage(chatId, { react: { text: "🔍", key: message.key } });

        const searchMsg = t('apk.searching', { query: query }, userLang);
        await sendWithChannelButton(sock, chatId, searchMsg, message);

        // Use centralized utility
        const aptoide = require('../lib/aptoide');
        let app;

        if (query.startsWith('http') && !query.includes('aptoide.com') && !query.includes('uptodown.com')) {
            app = await aptoide.getLinkInfo(query);
        } else {
            app = await aptoide.downloadInfo(query);
        }

        if (!app || !app.downloadUrl) {
            await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
            const notFoundMsg = t('apk.not_found', { query: query }, userLang);
            return await sendWithChannelButton(sock, chatId, notFoundMsg, message);
        }

        const sizeMB = app.sizeMB;

        // Large file warning
        if (parseFloat(sizeMB) > 300) {
            await sock.sendMessage(chatId, { react: { text: "⚠️", key: message.key } });
            const largeMsg = t('apk.too_large', { size: sizeMB }, userLang);
            return await sendWithChannelButton(sock, chatId, largeMsg, message);
        }

        // Check source
        if (app.source === 'Uptodown') {
            await sock.sendMessage(chatId, { react: { text: "🔗", key: message.key } });
            const uptodownMsg = t('apk.uptodown', {
                name: app.name,
                url: app.downloadUrl,
                botName: settings.botName
            }, userLang);

            return await sock.sendMessage(chatId, {
                text: uptodownMsg,
                contextInfo: {
                    externalAdReply: {
                        title: app.name,
                        body: "Click to Download from Uptodown",
                        mediaType: 1,
                        sourceUrl: app.downloadUrl,
                        thumbnailUrl: app.icon ? app.icon : null,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: message });
        }

        const caption = t('apk.caption', {
            name: app.name,
            package: app.package,
            updated: app.updated,
            size: sizeMB,
            botName: settings.botName
        }, userLang);

        // Step 2: React with upload icon
        await sock.sendMessage(chatId, { react: { text: "⬆️", key: message.key } });

        // Send the document directly using URL
        try {
            await sock.sendMessage(chatId, {
                document: { url: app.downloadUrl },
                fileName: `${app.name}.apk`,
                mimetype: 'application/vnd.android.package-archive',
                caption: caption,
                contextInfo: {
                    externalAdReply: {
                        title: app.name,
                        body: `${sizeMB} MB - APK Downloader`,
                        mediaType: 1,
                        sourceUrl: app.downloadUrl,
                        thumbnailUrl: app.icon,
                        renderLargerThumbnail: true,
                        showAdAttribution: false
                    }
                }
            }, { quoted: message });

            // Increment download count
            const remaining = incrementDownload(senderId);
            await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });

            const remainingMsg = t('apk.success', {
                remaining: remaining,
                limit: DAILY_LIMIT
            }, userLang);
            await sock.sendMessage(chatId, { text: remainingMsg }, { quoted: message });

        } catch (sendErr) {
            console.log('[APK] Direct URL send failed, trying local download:', sendErr.message);
            const tempPath = await aptoide.downloadToFile(app.downloadUrl);

            await sock.sendMessage(chatId, {
                document: { url: tempPath },
                fileName: `${app.name}.apk`,
                mimetype: 'application/vnd.android.package-archive',
                caption: caption
            }, { quoted: message });

            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

            // Increment download count
            const remaining = incrementDownload(senderId);
            await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });
        }

    } catch (error) {
        console.error('Error in apk command:', error);
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
        const errorMsg = t('apk.error', {}, userLang);
        await sendWithChannelButton(sock, chatId, errorMsg, message);
    }




}

module.exports = apkCommand;
