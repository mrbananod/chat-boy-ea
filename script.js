// script.js
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
  // Carga personas
  try {
    const res = await fetch('personas.json');
    state.systemPrompts = await res.json();
  } catch(e){
    state.systemPrompts = {
      "chat-boy-ea": "Eres Chat Boy de EA: carismático, directo, juguetón pero respetuoso. Hablas en español con vibra latina, breve y con intención.",
      "crush-ea": "Eres Crush on EA: tono cercano, dulce, con curiosidad genuina. Evitas clichés, mantienes elegancia.",
      "spicy-ea": "Eres Spicy EA: coqueteo ligero y humor sutil, nunca explícito. Estilo ágil, respuestas cortas."
    };
  }

  // Render inicial
  renderAll();
  // Mensaje de bienvenida si no hay historial
  if(state.history.length === 0){
    pushBot("Hola, soy Chat Boy de EA. ¿Qué quieres explorar hoy?");
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

  // Simulación de respuesta con estilo de persona
  const personaPrompt = state.systemPrompts[state.persona] || '';
  const reply = simulateReply(text, personaPrompt);

  await delay(600 + Math.random()*400);
  loader.remove();
  pushBot(reply);
});

personaSel.addEventListener('change', ()=>{
  state.persona = personaSel.value;
  pushBot(`Modo cambiado a: ${personaSel.options[personaSel.selectedIndex].text}. ¿Seguimos?`);
});

function delay(ms){ return new Promise(res=>setTimeout(res, ms)); }

// Simulador simple: reacciona con intención, reformula y hace una pregunta breve
function simulateReply(userText, personaPrompt){
  const tone = pickTone(personaPrompt);
  const intent = extractIntent(userText);
  const short = smartShorten(userText);

  const closers = [
    "¿Te sirve así?",
    "¿Quieres que lo llevemos más allá?",
    "¿Qué parte quieres afinar?",
    "Puedo darte un paso a paso si quieres."
  ];
  const closer = closers[Math.floor(Math.random()*closers.length)];

  return `${tone} ${short}. ${intent ? intent+' ' : ''}${closer}`;
}

function pickTone(prompt){
  if(prompt.includes('carismático')) return "Mmm, me gusta tu idea.";
  if(prompt.includes('dulce')) return "Qué bonito lo que propones.";
  if(prompt.includes('coqueteo')) return "Ok, juguemos con eso.";
  return "Vale, te sigo.";
}

function extractIntent(text){
  const t = text.toLowerCase();
  if(t.includes('guía') || t.includes('cómo')) return "Te doy una guía clara.";
  if(t.includes('idea') || t.includes('concepto')) return "Te propongo un concepto.";
  if(t.includes('diseño') || t.includes('estilo')) return "Definimos el estilo.";
  return "";
}

function smartShorten(text){
  if(text.length <= 120) return text;
  const cut = text.slice(0, 110);
  return cut.slice(0, cut.lastIndexOf(' ')) + "…";
}
