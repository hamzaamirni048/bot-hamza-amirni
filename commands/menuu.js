const { t } = require('../lib/language');

module.exports = async (sock, chatId, msg, args, commands, userLang) => {
    try {
        const prefix = settings.prefix;
        const botName = settings.botName || 'حمزة اعمرني';
        const isArabic = userLang === 'ar' || userLang === 'ma';

        // Runtime
        const runtime = process.uptime();
        const days = Math.floor(runtime / 86400);
        const hours = Math.floor((runtime % 86400) / 3600);
        const minutes = Math.floor((runtime % 3600) / 60);

        let thumbBuffer = null;
        try {
            let thumbPath = settings.botThumbnail;
            if (thumbPath && !path.isAbsolute(thumbPath)) {
                thumbPath = path.join(__dirname, '..', thumbPath);
            }
            if (thumbPath && fs.existsSync(thumbPath)) {
                thumbBuffer = fs.readFileSync(thumbPath);
            }
        } catch (e) { console.error('Error reading thumbnail:', e); }

        const date = new Date();
        const locale = isArabic ? 'ar-MA' : 'en-US';
        const dateStr = date.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const timeStr = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });


        // 2. Define Category Mappings (Keep English keys)
        const catMap = {
            'new': ['qwen', 'nanobanana', 'edit', 'genai', 'banana-ai', 'ghibli', 'tomp3', 'resetlink', 'apk', 'apk2', 'apk3', 'hidetag', 'imdb', 'simp'],
            'religion': ['quran', 'salat', 'prayertimes', 'adhan', 'hadith', 'asmaa', 'azkar', 'qibla', 'ad3iya', 'dua', 'athan', 'tafsir', 'surah', 'ayah', 'fadlsalat', 'hukm', 'qiyam', 'danb', 'nasiha', 'tadabbur', 'sahaba', 'faida', 'hasanat', 'jumaa', 'hajj', 'sira', 'mawt', 'shirk', 'hub', 'deen'],
            'download': ['facebook', 'instagram', 'tiktok', 'youtube', 'mediafire', 'github', 'play', 'song', 'video', 'ytplay', 'yts', 'apk'],
            'ai': ['gpt4o', 'gpt4om', 'gpt4', 'gpt3', 'o1', 'gemini-analyze', 'qwen', 'gpt', 'gemini', 'deepseek', 'imagine', 'aiart', 'miramuse', 'ghibli-art', 'faceswap', 'ai-enhance', 'colorize', 'vocalremover', 'musicgen', 'hdvideo', 'winkvideo', 'unblur', 'brat-vd'],
            'group': ['kick', 'promote', 'demote', 'tagall', 'hidetag', 'mute', 'unmute', 'close', 'open', 'delete', 'staff', 'groupinfo', 'welcome', 'goodbye', 'warn', 'warnings', 'antibadword', 'antilink', 'schedule'],
            'tools': ['pdf2img', 'stt', 'sticker', 'sticker-alt', 'attp', 'ttp', 'ocr', 'tts', 'say', 'toimage', 'tovideo', 'togif', 'qrcode', 'ss', 'lyrics', 'calc', 'img-blur', 'translate', 'readviewonce', 'upload'],
            'news': ['news', 'akhbar', 'football', 'kora', 'weather', 'taqes'],
            'daily': ['daily', 'top', 'shop', 'gamble', 'slots', 'profile'],
            'fun': ['joke', 'fact', 'quote', 'meme', 'character', 'truth', 'dare', 'ship', 'ngl', '4kwallpaper'],
            'games': ['menugame', 'xo', 'rps', 'math', 'guess', 'scramble', 'riddle', 'quiz', 'love', 'hangman', 'trivia'],
            'general': ['alive', 'ping', 'owner', 'script', 'setlang', 'system', 'help', 'allmenu'],
            'owner': ['mode', 'devmsg', 'autoreminder', 'pmblocker', 'backup', 'ban', 'unban', 'block', 'unblock', 'cleartmp', 'sudo', 'clear', 'clearsession', 'anticall', 'admin', 'addsudo', 'delsudo', 'listadmin']
        };

        const cmdIcons = {
            'genai': '🎨', 'edit': '🪄', 'banana-ai': '🍌', 'ghibli': '🎭', 'tomp3': '🎵', 'apk': '📱', 'apk2': '🚀', 'apk3': '🔥', 'simp': '💘',
            'quran': '📖', 'salat': '🕌', 'prayertimes': '🕋', 'adhan': '📢', 'hadith': '📚', 'asmaa': '✨', 'azkar': '📿', 'qibla': '🧭', 'ad3iya': '🤲', 'deen': '🕌',
            'facebook': '🔵', 'instagram': '📸', 'tiktok': '🎵', 'youtube': '🎬', 'mediafire': '📂', 'play': '🎧', 'song': '🎶', 'video': '🎥',
            'gpt': '🤖', 'gemini': '♊', 'deepseek': '🧠', 'imagine': '🖼️', 'aiart': '🌟', 'ghibli-art': '🎨', 'remini': '✨', 'qwen': '🦄', 'gemini-analyze': '🔍',
            'kick': '👠', 'promote': '🆙', 'demote': '⬇️', 'tagall': '📢', 'hidetag': '👻', 'mute': '🔇', 'unmute': '🔊', 'close': '🔒', 'open': '🔓',
            'sticker': '🖼️', 'translate': '🗣️', 'ocr': '🔍', 'qrcode': '🏁', 'weather': '🌦️', 'lyrics': '📜', 'calc': '🔢',
            'menugame': '🎮', 'quiz': '🧠', 'riddle': '🧩', 'joke': '🤣', 'meme': '🐸', 'truth': '💡', 'dare': '🔥',
            'profile': '👤', 'daily': '💰', 'top': '🏆', 'shop': '🛒',
            'alive': '🟢', 'ping': '⚡', 'owner': '👑', 'help': '❓'
        };


        const requested = args[0] ? args[0].toLowerCase() : null;

        const arCmds = {
            'gpt': 'ذكاء', 'gpt4': 'ذكاء4', 'gpt4o': 'ذكاء-برو', 'gpt4om': 'ذكاء-ميني', 'gpt3': 'ذكاء3', 'o1': 'ذكاء-متقدم',
            'gemini': 'جيميني', 'gemini-analyze': 'تحليل-صور', 'deepseek': 'بحث-عميق',
            'imagine': 'تخيل', 'aiart': 'رسم', 'genai': 'توليد-صور', 'nanobanana': 'نانو', 'banana-ai': 'موز',
            'ghibli': 'جيبلي', 'ghibli-art': 'فن-جيبلي', 'faceswap': 'تبديل-وجه',
            'ai-enhance': 'تحسين', 'colorize': 'تلوين', 'remini': 'ريميني', 'unblur': 'توضيح',
            'vocalremover': 'عزل-صوت', 'musicgen': 'توليد-موسيقى', 'removebg': 'حذف-خلفية',
            'qwen': 'كوين', 'miramuse': 'ميرا', 'edit': 'تعديل',
            'quran': 'قرآن', 'salat': 'صلاة', 'prayertimes': 'مواقيت', 'adhan': 'أذان',
            'hadith': 'حديث', 'ad3iya': 'أدعية', 'azkar': 'أذكار', 'qibla': 'قبلة',
            'tafsir': 'تفسير', 'surah': 'سورة', 'ayah': 'آية', 'dua': 'دعاء',
            'asmaa': 'أسماء-الله', 'fadlsalat': 'فضل-صلاة', 'hukm': 'حكم', 'qiyam': 'قيام',
            'danb': 'ذنب', 'nasiha': 'نصيحة', 'tadabbur': 'تدبر', 'sahaba': 'صحابة',
            'faida': 'فائدة', 'hasanat': 'حسنات', 'jumaa': 'جمعة', 'hajj': 'حج',
            'sira': 'سيرة', 'mawt': 'موت', 'shirk': 'شرك', 'hub': 'حب', 'deen': 'دين',
            'facebook': 'فيسبوك', 'instagram': 'انستا', 'youtube': 'يوتيوب', 'tiktok': 'تيكتوك',
            'mediafire': 'ميديافاير', 'play': 'شغل', 'song': 'أغنية', 'video': 'فيديو',
            'yts': 'بحث-يوتيوب', 'ytplay': 'تشغيل', 'apk': 'تطبيق', 'apk2': 'تطبيق2', 'apk3': 'تطبيق3',
            'github': 'جيتهاب',
            'sticker': 'ستيكر', 'translate': 'ترجمة', 'weather': 'طقس', 'calc': 'حساب',
            'pdf2img': 'صور-بي-دي-اف', 'ocr': 'استخراج-نص', 'tts': 'نطق', 'qrcode': 'كود-كيو-آر',
            'screenshot': 'سكرين', 'ss': 'لقطة', 'tomp3': 'صوت', 'toimage': 'صورة',
            'tovideo': 'فيديو', 'togif': 'جيف', 'attp': 'نص-متحرك', 'ttp': 'نص-ملون',
            'lyrics': 'كلمات', 'upload': 'رفع', 'readviewonce': 'قراءة-مرة', 'stt': 'كتابة-أوديو',
            'img-blur': 'طمس', 'say': 'قول', 'sticker-alt': 'ستيكر2',
            'kick': 'طرد', 'promote': 'ترقية', 'demote': 'تخفيض', 'ban': 'حظر',
            'tagall': 'منشن', 'hidetag': 'اخفاء', 'mute': 'كتم', 'unmute': 'الغاء-كتم',
            'close': 'اغلاق', 'open': 'فتح', 'antilink': 'منع-روابط', 'warn': 'تحذير',
            'antibadword': 'منع-شتائم', 'welcome': 'ترحيب', 'goodbye': 'وداع',
            'groupinfo': 'معلومات-مجموعة', 'staff': 'طاقم', 'delete': 'حذف',
            'warnings': 'تحذيرات',
            'joke': 'نكتة', 'fact': 'حقيقة', 'quote': 'اقتباس', 'meme': 'ميم',
            'truth': 'صراحة', 'dare': 'تحدي', 'ship': 'توافق', 'ngl': 'صراحة-مجهولة',
            '4kwallpaper': 'خلفيات', 'character': 'شخصية', 'goodnight': 'نعاس',
            'stupid': 'مكلخ', 'flirt': 'غزل', 'compliment': 'مدح', 'insult': 'سب',
            'menugame': 'قائمة-ألعاب', 'xo': 'اكس-او', 'tictactoe': 'اكس-او',
            'rps': 'حجر-ورقة', 'math': 'رياضيات', 'guess': 'تخمين', 'scramble': 'خلط-كلمات',
            'riddle': 'لغز', 'quiz': 'مسابقة', 'love': 'حب', 'hangman': 'مشنقة',
            'trivia': 'ثقافة', 'eightball': 'كرة-سحرية', 'guesswho': 'شكون-انا',
            'profile': 'بروفايل', 'daily': 'يومي', 'top': 'ترتيب', 'shop': 'متجر',
            'gamble': 'قمار', 'slots': 'ماكينة', 'blackjack': 'بلاك-جاك',
            'ping': 'بينغ', 'owner': 'المالك', 'help': 'مساعدة', 'alive': 'حي',
            'system': 'نظام', 'setlang': 'لغة', 'script': 'سكريبت', 'allmenu': 'كل-الأوامر',
            'mode': 'وضع', 'devmsg': 'بث', 'pmblocker': 'حظر-خاص', 'anticall': 'منع-مكالمات',
            'backup': 'نسخة-احتياطية', 'unban': 'الغاء-حظر', 'block': 'بلوك', 'unblock': 'فك-بلوك',
            'cleartmp': 'مسح-مؤقت', 'sudo': 'مشرف', 'clear': 'مسح', 'clearsession': 'مسح-جلسة',
            'autoreminder': 'تذكير-تلقائي',
            'admin': 'أدمن', 'addsudo': 'إضافة-مشرف', 'delsudo': 'حذف-مشرف', 'listadmin': 'قائمة-المشرفين', 'schedule': 'توقيت-المجموعة', 'autogroup': 'أوتو-قروب',
            'news': 'أخبار', 'akhbar': 'أخبار', 'football': 'كرة-قدم', 'kora': 'كورة',
            'taqes': 'طقس',
            'imdb': 'فيلم', 'resetlink': 'اعادة-رابط', 'hdvideo': 'فيديو-عالي',
            'winkvideo': 'وينك', 'brat-vd': 'برات', 'car': 'سيارة', 'recipe': 'وصفة',
            'currency': 'صرف', 'alloschool': 'مدرسة', 'checkimage': 'فحص-صورة',
            'pdf': 'بي-دي-اف', 'google': 'جوجل', 'wiki': 'ويكي'
        };

        const sendMenu = async (text, headerTitle = "Hamza Amirni Bot") => {
            const footerBranding = `\n\n🛡️ *${botName.toUpperCase()}* 🛡️\n📢 *${t('common.channel', {}, userLang)}:* ${settings.officialChannel}`;
            const fullText = text + footerBranding;

            if (thumbBuffer) {
                await sock.sendMessage(chatId, {
                    image: thumbBuffer,
                    caption: fullText,
                    contextInfo: {
                        mentionedJid: [chatId],
                        isForwarded: true,
                        forwardingScore: 999
                    }
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: fullText,
                    contextInfo: {
                        mentionedJid: [chatId],
                        isForwarded: true,
                        forwardingScore: 999,
                        externalAdReply: {
                            title: headerTitle,
                            body: `${t('owner_command.role', {}, userLang)}: ${t('common.botOwner', {}, userLang)}`,
                            thumbnail: thumbBuffer,
                            sourceUrl: settings.officialChannel || 'https://whatsapp.com/channel/0029ValXRoHCnA7yKopcrn1p',
                            mediaType: 1,
                            renderLargerThumbnail: true,
                            showAdAttribution: true
                        }
                    }
                }, { quoted: msg });
            }
        };

        // --- SUBMENU HANDLER ---
        if (requested) {
            const categoryAliases = {
                'ai': 'ai', 'ذكاء': 'ai',
                'islam': 'religion', 'دين': 'religion', 'islamic': 'religion', 'deen': 'religion',
                'download': 'download', 'تحميل': 'download',
                'tools': 'tools', 'services': 'tools', 'أدوات': 'tools',
                'fun': 'fun', 'ضحك': 'fun', 'ترفيه': 'fun',
                'game': 'games', 'games': 'games', 'ألعاب': 'games',
                'news': 'news', 'أخبار': 'news',
                'owner': 'owner', 'مطور': 'owner',
                'group': 'group', 'مجموعات': 'group',
                'economy': 'economy', 'اقتصاد': 'economy', 'bank': 'economy',
                'daily': 'daily'
            };

            let selectedKey = categoryAliases[requested] || (catMap[requested] ? requested : null);

            if (commands.has(requested)) {
                try {
                    const desc = t(`command_desc.${requested}`, {}, userLang);
                    const descText = desc.startsWith('command_desc.') ? (isArabic ? 'أمر متاح' : 'Available command') : desc;

                    await sendMenu(
                        `💡 *${isArabic ? 'معلومات عن الأمر' : 'Command Info'}:* \`${prefix}${requested}\`\n\n` +
                        `📝 *${isArabic ? 'الشرح' : 'Description'}:* ${descText}\n\n` +
                        `👤 *${t('owner_command.name', {}, userLang)}:* ${t('common.botOwner', {}, userLang)}`
                        , `${requested} info`);
                    return;
                } catch (e) { }
            }

            if (selectedKey && catMap[selectedKey]) {
                const header = `*┏━━❰ ⚔️ ${botName.toUpperCase()} ⚔️ ❱━━┓*\n`;
                let menuText = header + `\n✨ *${t('owner_command.status', {}, userLang)}: ${t(`menu.categories.${selectedKey}`, {}, userLang).toUpperCase()}* ✨\n` + `─━━━━━━━━━━━━━━─\n\n`;

                catMap[selectedKey].forEach(cmd => {
                    const icon = cmdIcons[cmd] || '🔹';
                    const displayName = (isArabic && arCmds[cmd]) ? arCmds[cmd] : cmd;
                    menuText += `${icon} *${prefix}${displayName}*\n`;
                });

                menuText += `\n─━━━━━━━━━━━━━━─\n` + `🔙 ${isArabic ? 'للرجوع' : 'Back'}: *.menu*`;
                return await sendMenu(menuText, selectedKey);
            }
        }

        // --- Execute Main Menu ---
        const bodyText =
            `╔═══════════════════════════╗\n` +
            `║   ⚔️ *${botName.toUpperCase()}* ⚔️   ║\n` +
            `╠═══════════════════════════╣\n` +
            `║ 👤 *${t('owner_command.name', {}, userLang)}:* ${t('common.botOwner', {}, userLang)}\n` +
            `║ 📅 *${t('group.date', {}, userLang)}:* ${dateStr}\n` +
            `║ ⏰ *Time:* ${timeStr}\n` +
            `║ 🔥 *${t('menu.uptime', {}, userLang)}:* ${days}d ${hours}h ${minutes}m\n` +
            `║ 🤖 *${t('menu.version', {}, userLang)}:* ${settings.version || '2.0.0'}\n` +
            `╚═══════════════════════════╝\n\n` +
            `✨ *━━━ ${t('menu.info_title', {}, userLang)} ━━━* ✨\n\n`;

        let mainMenu = bodyText;

        const sections = [
            { key: 'new' },
            { key: 'religion' },
            { key: 'ai' },
            { key: 'download' },
            { key: 'tools' },
            { key: 'fun' },
            { key: 'games' },
            { key: 'group' },
            { key: 'news' },
            { key: 'economy' },
            { key: 'general' },
            { key: 'owner' }
        ];

        let totalCmds = 0;
        sections.forEach(section => {
            const cmds = catMap[section.key];
            if (cmds && cmds.length > 0) {
                const title = t(`menu.categories.${section.key}`, {}, userLang);
                mainMenu += `\n┌─── ❰ ${title} ❱ ───┐\n`;

                cmds.forEach(cmd => {
                    const icon = cmdIcons[cmd] || '🔹';
                    const displayName = (isArabic && arCmds[cmd]) ? arCmds[cmd] : cmd;
                    const desc = t(`command_desc.${cmd}`, {}, userLang);
                    const descText = desc.startsWith('command_desc.') ? '' : ` - ${desc}`;
                    mainMenu += `│ ${icon} *.${displayName}*${descText}\n`;
                    totalCmds++;
                });

                mainMenu += `└──────────────────┘\n`;
            }
        });

        mainMenu += `\n\n╭─────────────────────────╮\n`;
        mainMenu += `│ 💡 *${t('menu.how_to_use', {}, userLang)}:* │\n`;
        mainMenu += `│ ${isArabic ? 'اكتب النقطة (.) قبل الأمر' : 'Type point (.) before command'} │\n`;
        mainMenu += `│ ${t('menu.example', {}, userLang)}: *.${isArabic ? 'ذكاء' : 'ai'}* │\n`;
        mainMenu += `╰─────────────────────────╯\n\n`;
        mainMenu += `⚡ *${t('menu.total_commands', {}, userLang)}:* ${totalCmds}\n`;
        if (isArabic) mainMenu += `🌟 *جميع الأوامر باللغة العربية*`;

        await sendMenu(mainMenu, t('menu.title', {}, userLang));

    } catch (error) {
        console.error('Error in menuu command:', error);
        await sock.sendMessage(chatId, { text: t('common.error', {}, userLang) });
    }
};
