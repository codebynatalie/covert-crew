// Shared defaults used by both the content script and the popup.
(function () {
  'use strict';
  const CC = (globalThis.CovertCrew = globalThis.CovertCrew || {});

  CC.IDS = ['dad', 'mom', 'kid', 'dog'];

  CC.DEFAULTS = {
    enabled: true,
    members: { dad: true, mom: true, kid: true, dog: true },
    scale: 1,
    reactToSearch: true,
    workEmotes: true,
    roam: true, // allow jumping onto page elements
    names: {}, // custom display names, e.g. { dad: 'Papa' }
    disabledSites: [], // hostnames where the crew stays home
  };

  CC.mergeSettings = function (raw) {
    const d = CC.DEFAULTS;
    const s = Object.assign({}, d, raw || {});
    s.members = Object.assign({}, d.members, (raw && raw.members) || {});
    s.names = Object.assign({}, (raw && raw.names) || {});
    s.disabledSites = Array.isArray(s.disabledSites) ? s.disabledSites.slice() : [];
    s.scale = Math.min(1.6, Math.max(0.6, Number(s.scale) || 1));
    return s;
  };
})();
