<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Movie Night</title>
<style>
  body {margin:0; font-family:sans-serif; background:#111; color:#eee; text-align:center;}
  #menu, #watch {max-width:1200px; margin:auto; padding:20px;}
  input, button, select {padding:10px; font-size:1.2em; margin:5px;}
  #controls {margin-top:10px;}
  iframe {width:100%; height:70vh; border:none; margin-top:20px;}
</style>
</head>
<body>

<div id="menu">
  <h1>🎬 Movie Night</h1>
  <p>Enter password to join:</p>
  <input type="text" id="pwInput" placeholder="Password">
  <button onclick="join()">Join</button>
  <p id="error" style="color:red;"></p>
</div>

<div id="watch" style="display:none;">
  <h1 id="roleTitle"></h1>
  <input type="text" id="videoUrl" placeholder="Paste VidKing embed link here" style="width:80%;">
  <div id="controls" style="display:none;">
    <button onclick="control('rewind')">⏪ 5s</button>
    <button onclick="control('playpause')">▶/⏸</button>
    <button onclick="control('skip')">5s ⏩</button>
    <select id="quality" onchange="changeQuality(this.value)">
      <option value="720">720p</option>
      <option value="1440">1440p</option>
    </select>
  </div>
  <iframe id="vidFrame" src="" allowfullscreen></iframe>
</div>

<script src="/socket.io/socket.io.js"></script>
<script>
const socket = io();
let role = null;
let hostPlaying = false;
let videoTime = 0;
let quality = '720';

async function join() {
  const pw = document.getElementById('pwInput').value.trim();
  const res = await fetch('/check-password?pw='+pw);
  const data = await res.json();
  if(!data.valid){document.getElementById('error').textContent='❌ Wrong password!'; return;}

  role = data.role;
  document.getElementById('menu').style.display='none';
  document.getElementById('watch').style.display='block';
  document.getElementById('roleTitle').textContent = role==='host' ? '🎬 You are Host' : '👀 You are Viewer';
  if(role==='host') document.getElementById('controls').style.display='block';
}

// Receive host updates
socket.on('updateState', (state) => {
  if(role==='viewer'){
    const frame = document.getElementById('vidFrame');
    frame.src = state.url + '#t=' + state.time + '&quality=' + state.quality;
  }
});

// Sync initial host state
socket.on('syncState', (state) => {
  if(role==='viewer'){
    const frame = document.getElementById('vidFrame');
    frame.src = state.url + '#t=' + state.time + '&quality=' + state.quality;
  }
});

function control(cmd){
  const iframe = document.getElementById('vidFrame');
  const url = document.getElementById('videoUrl').value;
  if(!url) return alert('Paste the VidKing embed link first');

  if(cmd==='playpause') hostPlaying = !hostPlaying;
  if(cmd==='rewind') videoTime = Math.max(0, videoTime-5);
  if(cmd==='skip') videoTime +=5;

  iframe.src = url + '#t=' + videoTime + '&quality=' + quality;
  // Broadcast to viewers
  socket.emit('hostUpdate', {url, playing: hostPlaying, time: videoTime, quality});
}

function changeQuality(q){
  quality = q;
  control('playpause'); // update iframe for all
}

// Keyboard shortcuts for host
document.addEventListener('keydown', e => {
  if(role!=='host') return;
  if(e.target.tagName==='INPUT') return;
  if(e.code==='Space'){ e.preventDefault(); control('playpause'); }
  if(e.code==='ArrowLeft') control('rewind');
  if(e.code==='ArrowRight') control('skip');
});
</script>
</body>
</html>
