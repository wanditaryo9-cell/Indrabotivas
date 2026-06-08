const TelegramBot = require('node-telegram-bot-api');
const IvasScraper = require('./scraper');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
const pollingInterval = parseInt(process.env.POLLING_INTERVAL) || 30000;

const bot = new TelegramBot(token, { polling: true });
const scraper = new IvasScraper();

let lastSmsTimestamp = null;
let isLoggedIn = false;

// Bot commands
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `
🤖 *Indra Bot IVAS* 

Selamat datang! Saya siap membantu Anda mengakses SMS dari IVAS.

*Perintah yang tersedia:*
/getnumbers - Ambil daftar nomor Anda
/getsms - Ambil SMS terbaru yang masuk
/help - Tampilkan bantuan
/status - Cek status koneksi

Ketik perintah untuk memulai! 🚀
  `;
  
  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `
📖 *Bantuan*

*Perintah Tersedia:*

/start - Tampilkan pesan sambutan
/getnumbers - Ambil daftar nomor dari "My Numbers"
/getsms - Ambil SMS terbaru dari "SMS Received"
/status - Cek status koneksi ke IVAS
/help - Tampilkan pesan bantuan ini

*Fitur Otomatis:*
Bot akan secara otomatis mengirimkan notifikasi SMS baru setiap ${pollingInterval/1000} detik.

*Tips:*
- Pastikan kredensial di .env sudah benar
- Bot membutuhkan koneksi internet yang stabil
- OTP dan SMS masuk akan ditampilkan secara real-time

Butuh bantuan? Hubungi developer! 💬
  `;
  
  bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

bot.onText(/\/status/, async (msg) => {
  const chatId = msg.chat.id;
  
  if (isLoggedIn) {
    bot.sendMessage(chatId, '✅ Status: *Terhubung ke IVAS*', { parse_mode: 'Markdown' });
  } else {
    bot.sendMessage(chatId, '❌ Status: *Belum terhubung ke IVAS*\nSedang mencoba login...', { parse_mode: 'Markdown' });
  }
});

bot.onText(/\/getnumbers/, async (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId, '⏳ Mengambil daftar nomor...');
  
  try {
    if (!isLoggedIn) {
      await scraper.init();
      const loginSuccess = await scraper.login();
      if (!loginSuccess) {
        bot.sendMessage(chatId, '❌ Gagal login ke IVAS. Cek kredensial di .env');
        return;
      }
      isLoggedIn = true;
    }

    const numbers = await scraper.getMyNumbers();
    
    if (numbers.length === 0) {
      bot.sendMessage(chatId, '⚠️ Tidak ada nomor ditemukan');
      return;
    }

    let message = `📱 *My Numbers (${numbers.length})*\n\n`;
    numbers.forEach((num, index) => {
      message += `${index + 1}. \`${num}\`\n`;
    });

    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in /getnumbers:', error);
    bot.sendMessage(chatId, `❌ Error: ${error.message}`);
  }
});

bot.onText(/\/getsms/, async (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId, '⏳ Mengambil SMS terbaru...');
  
  try {
    if (!isLoggedIn) {
      await scraper.init();
      const loginSuccess = await scraper.login();
      if (!loginSuccess) {
        bot.sendMessage(chatId, '❌ Gagal login ke IVAS. Cek kredensial di .env');
        return;
      }
      isLoggedIn = true;
    }

    const smsList = await scraper.getSmsReceived();
    
    if (smsList.length === 0) {
      bot.sendMessage(chatId, '⚠️ Tidak ada SMS ditemukan');
      return;
    }

    // Send first 5 SMS
    let message = `📨 *SMS Received (${smsList.length} total)*\n\n`;
    smsList.slice(0, 5).forEach((sms, index) => {
      message += `*${index + 1}. ${sms.service || 'UNKNOWN'}*\n`;
      message += `📱 From: ${sms.sender}\n`;
      message += `💬 Message: ${sms.message}\n`;
      message += `🕐 Time: ${sms.time}\n\n`;
    });

    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in /getsms:', error);
    bot.sendMessage(chatId, `❌ Error: ${error.message}`);
  }
});

// Auto polling for new SMS
async function pollForNewSms() {
  try {
    if (!isLoggedIn) {
      await scraper.init();
      const loginSuccess = await scraper.login();
      if (!loginSuccess) {
        console.log('❌ Auto-login failed');
        return;
      }
      isLoggedIn = true;
    }

    const smsList = await scraper.getSmsReceived();
    
    if (smsList.length > 0) {
      const latestSms = smsList[0];
      
      // Send notification if it's a new SMS
      if (!lastSmsTimestamp || new Date(latestSms.timestamp) > new Date(lastSmsTimestamp)) {
        const notification = `
🔔 *SMS Baru!*

📱 From: ${latestSms.sender}
💬 Message: ${latestSms.message}
🏷️ Service: ${latestSms.service || 'Unknown'}
🕐 Time: ${latestSms.time}
        `;
        
        bot.sendMessage(chatId, notification, { parse_mode: 'Markdown' });
        lastSmsTimestamp = latestSms.timestamp;
      }
    }
  } catch (error) {
    console.error('Auto-polling error:', error.message);
  }
}

// Start auto polling
setInterval(pollForNewSms, pollingInterval);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  await scraper.close();
  process.exit(0);
});

// Error handling
bot.on('error', (error) => {
  console.error('Telegram Bot Error:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

console.log('🤖 Indra Bot IVAS is running...');
console.log(`📱 Chat ID: ${chatId}`);
console.log(`⏱️ Polling interval: ${pollingInterval}ms`);
