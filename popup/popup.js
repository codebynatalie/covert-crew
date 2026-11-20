(async function () {
  'use strict';
  const CC = globalThis.CovertCrew;
  const $ = (sel) => document.querySelector(sel);

  const stored = await chrome.storage.local.get(['settings', 'skins']);
  let settings = CC.mergeSettings(stored.settings);
  let skins = stored.skins || {};

  const save = () => chrome.storage.local.set({ settings });
  const saveSkins = () => chrome.storage.local.set({ skins });

  // ----- toggles -----
  for (const key of ['enabled', 'reactToSearch', 'workEmotes', 'roam']) {
    const box = $('#' + key);
    box.checked = !!settings[key];
    box.addEventListener('change', () => {
      settings[key] = box.checked;
      save();
    });
  }

  const scale = $('#scale');
  scale.value = settings.scale;
  scale.addEventListener('change', () => {
    settings.scale = Number(scale.value);
    save();
  });

  // ----- current site -----
  let tab = null;
  try {
    [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  } catch (_) { /* ignore */ }
  let hostname = '';
  try {
    const u = new URL(tab && tab.url);
    if (u.protocol === 'http:' || u.protocol === 'https:') hostname = u.hostname;
  } catch (_) { /* no URL access */ }
  if (hostname) {
    $('#site-row').hidden = false;
    $('#site-name').textContent = hostname;
    const site = $('#site');
    site.checked = !settings.disabledSites.includes(hostname);
    site.addEventListener('change', () => {
      settings.disabledSites = settings.disabledSites.filter((h) => h !== hostname);
      if (!site.checked) settings.disabledSites.push(hostname);
      save();
    });
  }

  // ----- members -----
  const list = $('#members');
  const tpl = $('#member-tpl');
  const rows = {};

  function renderPic(id) {
    const pic = rows[id].querySelector('.pic');
    pic.textContent = '';
    if (skins[id]) {
      const img = new Image();
      img.src = skins[id];
      img.alt = '';
      pic.appendChild(img);
    } else {
      pic.innerHTML = CC.art[id].svg();
    }
    rows[id].querySelector('.reset').hidden = !skins[id];
  }

  for (const id of CC.IDS) {
    const art = CC.art[id];
    const row = tpl.content.firstElementChild.cloneNode(true);
    rows[id] = row;
    list.appendChild(row);

    const on = row.querySelector('.on');
    on.checked = settings.members[id] !== false;
    row.classList.toggle('off', !on.checked);
    on.addEventListener('change', () => {
      settings.members[id] = on.checked;
      row.classList.toggle('off', !on.checked);
      save();
    });

    const name = row.querySelector('.name');
    name.value = settings.names[id] || art.name;
    name.placeholder = art.name;
    name.addEventListener('change', () => {
      const v = name.value.trim();
      if (!v || v === art.name) delete settings.names[id];
      else settings.names[id] = v;
      name.value = v || art.name;
      save();
    });
    row.querySelector('.role').textContent = art.role;

    row.querySelector('input[type=file]').addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!file) return;
      try {
        skins[id] = await shrinkImage(file, 320);
        await saveSkins();
        renderPic(id);
      } catch (err) {
        note('Couldn\'t read that image. Try a PNG or JPG.');
      }
    });
    row.querySelector('.reset').addEventListener('click', async () => {
      delete skins[id];
      await saveSkins();
      renderPic(id);
    });
    renderPic(id);
  }

  async function shrinkImage(file, max) {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * k));
    const h = Math.max(1, Math.round(bmp.height * k));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(bmp, 0, 0, w, h);
    return canvas.toDataURL('image/png');
  }

  // ----- commands -----
  function note(text) {
    const n = $('#cmd-note');
    n.textContent = text;
    n.hidden = !text;
  }

  for (const btn of document.querySelectorAll('[data-cmd]')) {
    btn.addEventListener('click', async () => {
      note('');
      if (!tab || !tab.id) return note('Open a regular web page first.');
      if (!settings.enabled) return note('Turn the crew on first (top-right switch).');
      try {
        const res = await chrome.tabs.sendMessage(tab.id, { type: 'covert-crew', cmd: btn.dataset.cmd });
        if (!res || !res.ok) note('The crew is staying home on this site.');
      } catch (_) {
        note('The crew can\'t visit this page. If you just installed the extension, reload the tab.');
      }
    });
  }
})();
