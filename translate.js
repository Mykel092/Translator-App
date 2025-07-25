const translateBtn = document.getElementById('translateBtn');
const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const fromLang = document.getElementById('fromLang');
const toLang = document.getElementById('toLang');
const themeToggle = document.getElementById('themeToggle');

// Multiple translation methods to try
async function translateWithChromeAPI(text, sourceLang, targetLang) {
  if ('Translator' in self) {
    try {
      const translator = await self.Translator.create({
        sourceLanguage: sourceLang === 'auto' ? 'en' : sourceLang,
        targetLanguage: targetLang,
      });
      const result = await translator.translate(text);
      return result;
    } catch (error) {
      console.log('Chrome API failed:', error);
      throw error;
    }
  }
  throw new Error('Chrome Translator API not available');
}

async function translateWithProxy(text, sourceLang, targetLang) {
  const proxyUrl = 'https://api.allorigins.win/raw?url=';
  const targetUrl = encodeURIComponent('https://libretranslate.com/translate');
  
  const response = await fetch(proxyUrl + targetUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: text,
      source: sourceLang,
      target: targetLang,
      format: "text"
    })
  });
  
  if (!response.ok) throw new Error('Proxy request failed');
  const data = await response.json();
  return data.translatedText || data.text;
}

async function translateWithMymemory(text, sourceLang, targetLang) {
  const langPair = `${sourceLang}|${targetLang}`;
  const response = await fetch(
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`
  );
  
  if (!response.ok) throw new Error('MyMemory API failed');
  const data = await response.json();
  
  if (data.responseStatus === 200) {
    return data.responseData.translatedText;
  }
  throw new Error('Translation failed');
}

// Main translate function with fallbacks
translateBtn.addEventListener('click', async () => {
  const input = inputText.value.trim();
  const source = fromLang.value;
  const target = toLang.value;

  if (!input) {
    alert('Please enter some text to translate');
    return;
  }

  if (source === target) {
    outputText.value = input;
    return;
  }

  outputText.value = 'Translating...';
  
  // Try different translation methods in order
  const methods = [
    () => translateWithChromeAPI(input, source, target),
    () => translateWithMymemory(input, source, target),
    () => translateWithProxy(input, source, target)
  ];

  for (let i = 0; i < methods.length; i++) {
    try {
      const result = await methods[i]();
      if (result) {
        outputText.value = result;
        return;
      }
    } catch (error) {
      console.log(`Translation method ${i + 1} failed:`, error);
      if (i === methods.length - 1) {
        // Last method failed
        outputText.value = 'Translation failed. This might be due to network restrictions. Try a different browser or check your connection.';
      }
    }
  }
});

// Copy functions with feedback
async function copyToClipboard(text, elementName) {
  try {
    await navigator.clipboard.writeText(text);
    showNotification(`${elementName} copied!`);
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    showNotification(`${elementName} copied!`);
  }
}

function showNotification(message) {
  // Simple notification - you can replace with your preferred method
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed; top: 20px; right: 20px; 
    background: #4CAF50; color: white; 
    padding: 10px 20px; border-radius: 5px; 
    z-index: 1000; animation: fadeInOut 2s;
  `;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 2000);
}

// Add CSS for notification animation if not already present
if (!document.querySelector('#notification-styles')) {
  const style = document.createElement('style');
  style.id = 'notification-styles';
  style.textContent = `
    @keyframes fadeInOut {
      0% { opacity: 0; transform: translateY(-20px); }
      20%, 80% { opacity: 1; transform: translateY(0); }
      100% { opacity: 0; transform: translateY(-20px); }
    }
  `;
  document.head.appendChild(style);
}

document.getElementById('copyInput')?.addEventListener('click', () => {
  copyToClipboard(inputText.value, 'Input text');
});

document.getElementById('copyOutput')?.addEventListener('click', () => {
  copyToClipboard(outputText.value, 'Translation');
});

// Helper to get language code for speech synthesis
function getSpeechLangCode(lang) {
  switch (lang) {
    case 'en': return 'en-US'; 
    case 'ru': return 'ru-RU'; // Russia (default to English)
    case 'es': return 'es-ES'; // Spanish (default to English)
    case 'fr': return 'fr-FR'; // French (default to English)
    case 'de': return 'de-DE'; // German (default to English)
    case 'yo': return 'en-US'; // Yoruba (default to English)
    case 'ig': return 'en-US'; // Igbo (default to English)
    case 'ha': return 'en-US'; // Hausa (default to English)
    default: return 'en-US';
  }
}

document.getElementById('speakInput')?.addEventListener('click', () => {
  if (inputText.value.trim()) {
    const utterance = new SpeechSynthesisUtterance(inputText.value);
    utterance.lang = getSpeechLangCode(fromLang.value);
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
  }
});

document.getElementById('speakOutput')?.addEventListener('click', () => {
  if (outputText.value.trim() && !outputText.value.includes('Translating') && !outputText.value.includes('failed')) {
    const utterance = new SpeechSynthesisUtterance(outputText.value);
    utterance.lang = getSpeechLangCode(toLang.value);
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
  }
});

// Dark/Light Mode Toggle with persistence
themeToggle?.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  themeToggle.textContent = isDark ? '🌞' : '🌙';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// Load saved theme and check for Chrome AI support
document.addEventListener('DOMContentLoaded', () => {
  // Load theme
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
    if (themeToggle) themeToggle.textContent = '🌞';
  }
  
  // Check for Chrome AI support
  if ('Translator' in self) {
    console.log('✅ Chrome built-in translation is available!');
  } else {
    console.log('ℹ️ Using fallback translation methods');
  }
});