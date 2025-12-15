const chatEl = document.getElementById('chat');
const formEl = document.getElementById('inputForm');
const inputEl = document.getElementById('userInput');
const personaSel = document.getElementById('personaSelect');

const STORAGE_KEY = 'chat-boy-ea:history';
let state = {
  persona: 'chat-boy-ea',
  history: loadHistory(),
  systemPrompts: {}
};

init();

async function init(){
  try {
    const res = await fetch('personas.json');
    state.systemPrompts = await res.json();
  } catch(e){
    // Configuración por defecto si no existe personas.json
    state.systemPrompts = {
      "chat-boy-ea": { 
        "prompt": "Carismático, directo, juguetón pero respetuoso.", 
        "intro": "👋 Hola, soy Chat Boy de EA. Estoy aquí para charlar contigo con estilo." 
      },
      "crush-ea": { 
        "prompt": "Tono cercano, dulce, con curiosidad genuina.", 
        "intro": "Hola, soy Crush on EA, ¿me cuentas algo de ti?" 
      },
      "spicy-ea": { 
        "prompt": "Coqueteo ligero y humor sutil.", 
        "intro": "Spicy EA aquí, ¿listo para un poco de picante?" 
      }
    };
  }

  renderAll();
  if(state.history.length === 0){
    pushBot(state.systemPrompts[state.persona].intro);
  }
}

function loadHistory(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch(e){ return []; }
}

function saveHistory(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.history));
}

function renderAll(){
  chatEl.innerHTML = '';
  state.history.forEach(m => renderMsg(m.role, m.text));
  chatEl.scrollTop = chatEl.scrollHeight;
}

function renderMsg(role, text){
  const wrap = document.createElement('div');
  wrap.className = `msg ${role}`;
  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.textContent = role === 'user' ? 'Tú' : personaSel.options[personaSel.selectedIndex].text;
  const body = document.createElement('div');
  body.innerHTML = sanitize(text);
  wrap.appendChild(meta); wrap.appendChild(body);
  chatEl.appendChild(wrap);
  chatEl.scrollTop = chatEl.scrollHeight;
}

function sanitize(s){
  return s.replace(/[<>&]/g, (c)=>({ '<':'&lt;', '>':'&gt;', '&':'&amp;' }[c]));
}

function pushUser(text){
  const msg = { role:'user', text };
  state.history.push(msg);
  saveHistory();
  renderMsg('user', text);
}

function pushBot(text){
  const msg = { role:'bot', text };
  state.history.push(msg);
  saveHistory();
  renderMsg('bot', text);
}

function showTyping(){
  const wrap = document.createElement('div');
  wrap.className = 'msg bot';
  wrap.innerHTML = `<span class="typing"></span><span class="typing"></span><span class="typing"></span>`;
  chatEl.appendChild(wrap);
  chatEl.scrollTop = chatEl.scrollHeight;
  return wrap;
}

formEl.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const text = inputEl.value.trim();
  if(!text) return;
  inputEl.value = '';
  pushUser(text);

  const loader = showTyping();

  const personaPrompt = state.systemPrompts[state.persona].prompt;
  const reply = simulateReply(text, personaPrompt);

  // Espera para simular escritura
  await delay(1000 + Math.random()*500);
  loader.remove();
  pushBot(reply);
});

personaSel.addEventListener('change', ()=>{
  state.persona = personaSel.value;
  pushBot(state.systemPrompts[state.persona].intro);
});

function delay(ms){ return new Promise(res=>setTimeout(res, ms)); }

function simulateReply(userText, personaPrompt){
  const tone = pickTone(personaPrompt);
  const short = smartShorten(userText);

  const closers = [
    "¿Te sirve así?",
    "¿Quieres que lo llevemos más allá?",
    "¿Qué parte quieres afinar?",
    "Puedo darte un paso a paso si quieres."
  ];
  const closer = closers[Math.floor(Math.random()*closers.length)];

  return `${tone} ${short}. ${closer}`;
}

function pickTone(prompt){
  if(prompt.includes('Carismático')) return "😏 Me gusta tu idea.";
  if(prompt.includes('dulce')) return "✨ Qué bonito lo que propones.";
  if(prompt.includes('Coqueteo')) return "🔥 Ok, juguemos con eso.";
  return "Vale, te sigo.";
}

function smartShorten(text){
  if(text.length <= 120) return text;
  const cut = text.slice(0, 110);
  return cut.slice(0, cut.lastIndexOf(' ')) + "…";
}
