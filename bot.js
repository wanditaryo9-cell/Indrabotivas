const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

// =====================================
// CONFIG - LANGSUNG MASUKIN DI SINI
// =====================================

const TOKEN = '8892905505:AAHEcRltm6jxSZLAiYVLXBUvEYmQucKX8qE';
const CHAT_ID = 5656783171;
const IVAS_EMAIL = 'gusmanman523@gmail.com';
const IVAS_PASSWORD = '1Ndr4Ykvc@';

// =====================================
// DATABASE
// =====================================

let db = [];
let numberList = {};
let otpCache = {};
let stats = {
  total: 0,
  success: 0,
  failed: 0,
  today: new Date().toLocaleDateString()
};

const JSON_FILE = 'data.json';
const LOG_FILE = 'bot.log';

// =====================================
// LOAD DATABASE
// =====================================

if (fs.existsSync(JSON_FILE)) {
  try {
    db = JSON.parse(fs.readFileSync(JSON_FILE));
  } catch (e) {
    console.log('Failed to load database');
  }
}

// =====================================
// LOG FUNCTION
// =====================================

function log(txt) {
  const timestamp = new Date().toLocaleString();
  const logText = `[${timestamp}] ${txt}`;
  
  fs.appendFileSync(LOG_FILE, logText + '\n');
  console.log(logText);
}

// =====================================
// SAVE DATABASE
// =====================================

function saveDb() {
  fs.writeFileSync(JSON_FILE, JSON.stringify(db, null, 2));
}

// =====================================
// BOT INITIALIZATION
// =====================================

const bot = new TelegramBot(TOKEN, { polling: true });

log('🤖 Indra Bot IVAS - Started');
log(`📱 Chat ID: ${CHAT_ID}`);
log(`👤 Email: ${IVAS_EMAIL}`);

// =====================================
// COMMANDS
// =====================================

// /start command
bot.onText(/\/start|\/menu/, (msg) => {
  const welcome = `
╔════════════════════╗
   🤖 INDRA BOT IVAS
╚════════════════════╝

🟢 STATUS: ONLINE
⚡ MODE: ACTIVE

📦 DATABASE: ${db.length}
📱 NUMBERS: ${Object.keys(numberList).length}

📊 TODAY STATS:
✅ Success: ${stats.success}
❌ Failed: ${stats.failed}
📈 Total: ${stats.total}

👇 Pilih menu di bawah
  `;

  const keyboard = {
    reply_markup: {
      keyboard: [
        ['📱 Get Numbers', '🔐 Get OTP'],
        ['📊 Statistics', '💾 Database'],
        ['🗑️ Clear', '❓ Help']
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    }
  };

  bot.sendMessage(msg.chat.id, welcome, keyboard);
});

// /help command
bot.onText(/\/help|❓ Help/, (msg) => {
  const help = `
📖 *BANTUAN*

*PERINTAH:*
/start - Menu utama
/status - Status bot
/get - Ambil nomor IVAS
/numbers - Daftar nomor
/clear - Clear database
/reset - Reset stats

*FITUR:*
✅ Auto SMS detection
✅ OTP tracker
✅ Real-time notification
✅ Database storage

*KEYBOARD:*
📱 Get Numbers - Ambil dari IVAS
🔐 Get OTP - Lihat OTP terbaru
📊 Statistics - Statistik
💾 Database - Export database
  `;

  bot.sendMessage(msg.chat.id, help, { parse_mode: 'Markdown' });
});

// /status command
bot.onText(/\/status|🛰️ Status/, (msg) => {
  const uptime = Math.floor((Date.now() / 1000) / 60);
  
  const status = `
🛰️ *BOT STATUS*

🟢 *ONLINE*
⚡ Response: Normal

📦 Database: ${db.length}
📱 Numbers: ${Object.keys(numberList).length}

⏱️ Uptime: ${uptime} menit

📊 Stats:
✅ ${stats.success}
❌ ${stats.failed}
📈 ${stats.total}
  `;

  bot.sendMessage(msg.chat.id, status, { parse_mode: 'Markdown' });
});

// Get numbers
bot.onText(/\/get|📱 Get Numbers/, async (msg) => {
  bot.sendMessage(msg.chat.id, '⏳ Mengambil data dari IVAS...');

  try {
    // Simulasi ambil nomor dari IVAS
    const fakeNumbers = [
      '+237621000001',
      '+237621000002',
      '+237621000003'
    ];

    fakeNumbers.forEach(num => {
      if (!numberList[num]) {
        numberList[num] = {
          added: new Date().toLocaleString(),
          otp: null,
          status: 'waiting'
        };
        stats.total++;
      }
    });

    const list = Object.keys(numberList)
      .map((num, i) => `${i+1}. ${num}`)
      .join('\n');

    bot.sendMessage(
      msg.chat.id,
      `✅ *Nomor Berhasil Diambil*\n\n${list}`,
      { parse_mode: 'Markdown' }
    );

    stats.success++;
    log('GET: ' + fakeNumbers.length + ' numbers');

  } catch (error) {
    stats.failed++;
    bot.sendMessage(msg.chat.id, '❌ Error mengambil nomor\n' + error.message);
    log('GET ERROR: ' + error.message);
  }
});

// Get OTP
bot.onText(/\/otp|🔐 Get OTP/, (msg) => {
  const numWithOtp = Object.entries(numberList)
    .filter(([num, data]) => data.otp)
    .map(([num, data], i) => `${i+1}. ${num}\n   OTP: \`${data.otp}\``)
    .join('\n\n');

  if (!numWithOtp) {
    return bot.sendMessage(msg.chat.id, '⏳ Belum ada OTP masuk');
  }

  const message = `
🔐 *OTP TERBARU*

${numWithOtp}

⏱️ Waktu: ${new Date().toLocaleString()}
  `;

  bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
});

// Statistics
bot.onText(/\/stats|📊 Statistics/, (msg) => {
  const rate = stats.total ? Math.floor((stats.success / stats.total) * 100) : 0;

  const stats_msg = `
📊 *STATISTIK*

📈 Total: ${stats.total}
✅ Success: ${stats.success}
❌ Failed: ${stats.failed}
📉 Rate: ${rate}%

📅 Tanggal: ${stats.today}
  `;

  bot.sendMessage(msg.chat.id, stats_msg, { parse_mode: 'Markdown' });
});

// Database export
bot.onText(/\/database|💾 Database/, async (msg) => {
  try {
    if (fs.existsSync(JSON_FILE)) {
      await bot.sendDocument(msg.chat.id, JSON_FILE);
      log('Database exported');
    } else {
      bot.sendMessage(msg.chat.id, '❌ Database belum ada');
    }
  } catch (error) {
    bot.sendMessage(msg.chat.id, '❌ Error export database');
  }
});

// List numbers
bot.onText(/\/numbers/, (msg) => {
  const nums = Object.entries(numberList);
  
  if (!nums.length) {
    return bot.sendMessage(msg.chat.id, '❌ Belum ada nomor');
  }

  let list = `📱 *DAFTAR NOMOR* (${nums.length})\n\n`;
  nums.forEach(([num, data], i) => {
    const otp = data.otp ? `✅ ${data.otp}` : '⏳ Waiting';
    list += `${i+1}. ${num}\n   ${otp}\n\n`;
  });

  bot.sendMessage(msg.chat.id, list, { parse_mode: 'Markdown' });
});

// Clear numbers
bot.onText(/\/clear|🗑️ Clear/, (msg) => {
  numberList = {};
  
  bot.sendMessage(msg.chat.id, '✅ Numbers berhasil dihapus');
  log('Numbers cleared');
});

// Reset stats
bot.onText(/\/reset/, (msg) => {
  stats = {
    total: 0,
    success: 0,
    failed: 0,
    today: new Date().toLocaleDateString()
  };

  bot.sendMessage(msg.chat.id, '✅ Statistics berhasil direset');
  log('Stats reset');
});

// Handle regular messages (keyboard)
bot.on('message', (msg) => {
  const text = msg.text;
  
  if (!text.startsWith('/')) {
    if (text === '📱 Get Numbers') {
      bot.emit('text', msg, [null, null]);
    } else if (text === '🔐 Get OTP') {
      bot.emit('text', msg, [null, null]);
    } else if (text === '📊 Statistics') {
      bot.emit('text', msg, [null, null]);
    } else if (text === '💾 Database') {
      bot.emit('text', msg, [null, null]);
    } else if (text === '🗑️ Clear') {
      bot.emit('text', msg, [null, null]);
    } else if (text === '❓ Help') {
      bot.emit('text', msg, [null, null]);
    }
  }
});

// Error handling
bot.on('error', (error) => {
  log('❌ Bot Error: ' + error.message);
});

bot.on('polling_error', (error) => {
  log('❌ Polling Error: ' + error.message);
});

process.on('unhandledRejection', (reason) => {
  log('❌ Unhandled Rejection: ' + reason);
});

// =====================================
// AUTO STATS RESET
// =====================================

setInterval(() => {
  const today = new Date().toLocaleDateString();
  if (stats.today !== today) {
    stats = {
      total: 0,
      success: 0,
      failed: 0,
      today
    };
    log('Daily stats reset');
  }
}, 60000);

// =====================================
// AUTO SAVE DATABASE
// =====================================

setInterval(() => {
  saveDb();
}, 30000);

// =====================================
// STARTUP MESSAGE
// =====================================

setTimeout(() => {
  const msg = `
🟢 *BOT ONLINE*

✅ Indra Bot IVAS is running
🤖 Ready to receive commands

📱 Chat ID: ${CHAT_ID}
⏱️ Time: ${new Date().toLocaleString()}

Type /help for commands
  `;

  bot.sendMessage(CHAT_ID, msg, { parse_mode: 'Markdown' }).catch(console.error);
  log('Startup message sent');
}, 1000);

log('🎉 Bot is ready!');
