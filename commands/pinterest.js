// plugin by hamza amirni
const axios = require("axios");
const { generateWAMessageContent, generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');
const settings = require('../settings');

const base = "https://www.pinterest.com";
const search = "/resource/BaseSearchResource/get/";

const headers = {
    'accept': 'application/json, text/javascript, */*',
    'referer': 'https://www.pinterest.com/',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    'x-requested-with': 'XMLHttpRequest'
};

async function getCookies() {
    try {
        const response = await axios.get(base);
        const setHeaders = response.headers['set-cookie'];
        if (setHeaders) {
            return setHeaders.map(s => s.split(';')[0].trim()).join('; ');
        }
        return null;
    } catch (e) {
        return null;
    }
}

async function searchPinterest(query) {
    try {
        const cookies = await getCookies();
        const params = {
            source_url: `/search/pins/?q=${query}`,
            data: JSON.stringify({
                options: { query, scope: "pins", page_size: 10 },
                context: {}
            }),
            _: Date.now()
        };

        const { data } = await axios.get(`${base}${search}`, { 
            headers: { ...headers, 'cookie': cookies || '' }, 
            params 
        });

        const results = data.resource_response.data.results.filter(v => v.images?.orig);
        if (results.length === 0) return { status: false, message: "No results found." };

        return {
            status: true,
            pins: results.map(v => ({
                title: v.title || "Untitled",
                description: v.description || "No description",
                pin_url: `https://pinterest.com/pin/${v.id}`,
                image: v.images.orig.url,
                uploader: v.pinner?.full_name || "Unknown"
            }))
        };
    } catch (e) {
        return { status: false, message: e.message };
    }
}

module.exports = async (sock, chatId, msg, args, commands, userLang) => {
    const text = args.join(' ');
    if (!text) {
        return sock.sendMessage(chatId, { text: `• *Example:* .pinterest nature` }, { quoted: msg });
    }

    await sock.sendMessage(chatId, { react: { text: "⏳", key: msg.key } });

    async function createImage(url) {
        try {
            const { imageMessage } = await generateWAMessageContent({ image: { url } }, { upload: sock.waUploadToServer });
            return imageMessage;
        } catch (e) {
            console.error(`Pinterest Image Error: ${url}`);
            // Fallback to a stable image
            const fallback = 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1000';
            try {
                const { imageMessage } = await generateWAMessageContent({ image: { url: fallback } }, { upload: sock.waUploadToServer });
                return imageMessage;
            } catch (err) {
                return null;
            }
        }
    }

    let result = await searchPinterest(text);
    if (!result.status) {
        return sock.sendMessage(chatId, { text: `⚠️ ${result.message}` }, { quoted: msg });
    }

    let cards = [];
    let i = 1;
    for (let pin of result.pins.slice(0, 10)) {
        const imageMessage = await createImage(pin.image);
        if (!imageMessage) continue;

        cards.push({
            body: proto.Message.InteractiveMessage.Body.fromObject({
                text: `📌 *Title:* ${pin.title}\n👤 *Uploader:* ${pin.uploader}\n🔗 *URL:* ${pin.pin_url}`
            }),
            footer: proto.Message.InteractiveMessage.Footer.fromObject({
                text: `乂 ${settings.botName} 🧠`
            }),
            header: proto.Message.InteractiveMessage.Header.fromObject({
                title: `Result ${i++}`,
                hasMediaAttachment: true,
                imageMessage
            }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                buttons: [
                    {
                        "name": "cta_url",
                        "buttonParamsJson": `{"display_text":"View on Pinterest","url":"${pin.pin_url}"}`
                    }
                ]
            })
        });
    }

    const menuMsg = generateWAMessageFromContent(chatId, {
        viewOnceMessage: {
            message: {
                messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                    body: proto.Message.InteractiveMessage.Body.create({ text: `✨ Pinterest Search: *${text}*\n\nSwipe cards to view more results...` }),
                    footer: proto.Message.InteractiveMessage.Footer.create({ text: `© ${settings.botName} 2026` }),
                    header: proto.Message.InteractiveMessage.Header.create({ hasMediaAttachment: false }),
                    carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({ cards })
                })
            }
        }
    }, { quoted: msg });

    await sock.relayMessage(chatId, menuMsg.message, { messageId: menuMsg.key.id });
    await sock.sendMessage(chatId, { react: { text: "✅", key: msg.key } });
};

