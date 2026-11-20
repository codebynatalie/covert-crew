// Styles injected into the crew's shadow root (isolated from page CSS).
(function () {
  'use strict';
  const CC = (globalThis.CovertCrew = globalThis.CovertCrew || {});

  const EYES = ['open', 'happy', 'closed', 'wide', 'x', 'heart', 'star', 'sad', 'angry'];
  const MOUTHS = ['smile', 'grin', 'o', 'flat', 'frown', 'wavy', 'smirk'];
  const PROPS = ['paper', 'wrench', 'bone'];

  const variantRules =
    EYES.map((n) => `[data-eyes="${n}"] .ev-${n}`).join(',') + ',' +
    MOUTHS.map((n) => `[data-mouth="${n}"] .mv-${n}`).join(',') + ',' +
    PROPS.map((n) => `[data-prop="${n}"] .prop-${n}`).join(',') +
    ',[data-blush="1"] .blush,[data-sweat="1"] .sweat,[data-acc="shades"] .shades{display:inline}';

  CC.css = `
:host{all:initial}
.stage{position:fixed;inset:0;pointer-events:none;overflow:hidden;contain:strict;
  font-family:"Segoe UI",system-ui,-apple-system,Roboto,sans-serif}
.stage.hidden{display:none}
.char{position:absolute;left:0;top:0;pointer-events:auto;cursor:grab;touch-action:none;
  user-select:none;-webkit-user-select:none;will-change:transform}
.char.held{cursor:grabbing;z-index:50!important}
.wrap{width:100%;height:100%;transform-origin:50% 100%}
.held .wrap{transform-origin:50% 12%}
.anim{width:100%;height:100%;transform-origin:50% 100%}
.art{display:block;width:100%;height:100%;overflow:visible;
  filter:drop-shadow(0 1.5px 0 rgba(0,0,0,.18))}
.anim img{display:block;width:100%;height:100%;object-fit:contain;pointer-events:none;
  filter:drop-shadow(0 1.5px 0 rgba(0,0,0,.18))}

/* face + accessory variants */
.ev,.mv,.blush,.sweat,.shades,.prop{display:none}
${variantRules}

/* animatable parts */
.art .leg,.art .arm,.art .legs,.art .upper,.art .tail,.art .head,.art .ear{transform-box:fill-box}
.art .leg,.art .arm{transform-origin:50% 0}
.art .arm-r{--dir:-1}
.art .legs{transform-origin:50% 100%;transition:transform .25s}
.art .upper{transition:transform .25s}
.art .tail{transform-origin:100% 100%;animation:cc-wag .55s ease-in-out infinite alternate}
.art .head{transform-origin:15% 85%}
.art .ear{transform-origin:50% 10%}
.dog[data-mood="happy"] .tail{animation-duration:.14s}

@keyframes cc-swing{from{transform:rotate(-20deg)}to{transform:rotate(20deg)}}
@keyframes cc-swing-s{from{transform:rotate(-8deg)}to{transform:rotate(8deg)}}
@keyframes cc-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3%)}}
@keyframes cc-breathe{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.022)}}
@keyframes cc-climb{from{transform:rotate(calc(150deg * var(--dir,1)))}to{transform:rotate(calc(195deg * var(--dir,1)))}}
@keyframes cc-wave{from{transform:rotate(calc(130deg * var(--dir,1)))}to{transform:rotate(calc(170deg * var(--dir,1)))}}
@keyframes cc-dance{0%,100%{transform:rotate(-7deg) translateY(0)}25%{transform:rotate(0) translateY(-9%)}
  50%{transform:rotate(7deg) translateY(0)}75%{transform:rotate(0) translateY(-9%)}}
@keyframes cc-spin{0%{transform:scaleX(1)}50%{transform:scaleX(-1)}100%{transform:scaleX(1)}}
@keyframes cc-wag{from{transform:rotate(-22deg)}to{transform:rotate(22deg)}}
@keyframes cc-kick{0%,100%{transform:rotate(0)}35%,65%{transform:rotate(-95deg)}}
@keyframes cc-punch{0%,100%{transform:rotate(calc(20deg * var(--dir,1)))}50%{transform:rotate(calc(95deg * var(--dir,1)))}}
@keyframes cc-sniff{from{transform:rotate(0)}to{transform:rotate(10deg)}}
@keyframes cc-tinker{from{transform:rotate(-40deg)}to{transform:rotate(-70deg)}}
@keyframes cc-pat{from{transform:rotate(-120deg)}to{transform:rotate(-100deg)}}
@keyframes cc-pet{from{transform:rotate(-50deg)}to{transform:rotate(-30deg)}}
@keyframes cc-flap{from{transform:rotate(-10deg)}to{transform:rotate(25deg)}}
@keyframes cc-snore{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.04)}}
@keyframes cc-waddle{0%,100%{transform:rotate(-5deg) translateY(0)}50%{transform:rotate(5deg) translateY(-4%)}}
@keyframes cc-pop{from{scale:.4;opacity:0}to{scale:1;opacity:1}}

/* idle */
.s-idle .anim{animation:cc-breathe 2.6s ease-in-out infinite}

/* walking / running / sneaking */
.s-walk .leg-l,.s-sneak .leg-l{animation:cc-swing .42s ease-in-out infinite alternate}
.s-walk .leg-r,.s-sneak .leg-r{animation:cc-swing .42s ease-in-out infinite alternate-reverse}
.s-walk .arm-l,.s-sneak .arm-l{animation:cc-swing .42s ease-in-out infinite alternate-reverse}
.s-walk .arm-r,.s-sneak .arm-r{animation:cc-swing .42s ease-in-out infinite alternate}
.s-walk .anim{animation:cc-bob .42s ease-in-out infinite}
.s-sneak .anim{transform:translateY(5%) scaleY(.94)}
.s-sneak .leg-l,.s-sneak .leg-r,.s-sneak .arm-l,.s-sneak .arm-r{animation-duration:.7s}
.s-run .leg-l{animation:cc-swing .22s ease-in-out infinite alternate}
.s-run .leg-r{animation:cc-swing .22s ease-in-out infinite alternate-reverse}
.s-run .arm-l{animation:cc-swing .22s ease-in-out infinite alternate-reverse}
.s-run .arm-r{animation:cc-swing .22s ease-in-out infinite alternate}
.s-run .anim{animation:cc-bob .22s ease-in-out infinite}
.dog.s-run .ear{animation:cc-flap .18s ease-in-out infinite alternate}

/* climbing walls */
.s-climb .arm-l,.s-climb .arm-r{animation:cc-climb .45s ease-in-out infinite alternate}
.s-climb .arm-r{animation-direction:alternate-reverse}
.s-climb .leg-l{animation:cc-swing-s .45s ease-in-out infinite alternate}
.s-climb .leg-r{animation:cc-swing-s .45s ease-in-out infinite alternate-reverse}
.s-cling .arm-l{transform:rotate(168deg)}
.s-cling .arm-r{transform:rotate(-168deg)}
.s-cling .leg-l{transform:rotate(10deg)}
.s-cling .leg-r{transform:rotate(-10deg)}

/* being carried / falling */
.s-held .arm-l{transform:rotate(150deg)}
.s-held .arm-r{transform:rotate(-150deg)}
.s-held .leg-l{animation:cc-swing-s .5s ease-in-out infinite alternate}
.s-held .leg-r{animation:cc-swing-s .5s ease-in-out infinite alternate-reverse}
.dog.s-held .leg-l,.dog.s-held .leg-r{animation:cc-swing .3s ease-in-out infinite alternate}
.s-fall .arm-l{animation:cc-wave .2s infinite alternate}
.s-fall .arm-r{animation:cc-wave .2s infinite alternate-reverse}

/* sitting / sleeping */
.s-sit .legs,.s-sleep .legs{transform:scaleY(.42)}
.s-sit .upper,.s-sleep .upper{transform:translateY(var(--sit))}
.s-sleep .anim{animation:cc-snore 2.4s ease-in-out infinite}
.dog.s-sit .art{transform:rotate(-13deg);transform-origin:20% 95%}
.dog.s-sleep .leg{transform:scaleY(.35)}
.dog.s-sleep .art{transform:translateY(12%)}
.dog.s-sleep .tail{animation:none}

/* poses */
.s-wave .arm-r{animation:cc-wave .28s ease-in-out infinite alternate}
.s-dance .anim{animation:cc-dance .6s ease-in-out infinite}
.s-dance .arm-l,.s-dance .arm-r{animation:cc-wave .3s ease-in-out infinite alternate}
.s-kick .leg-r{animation:cc-kick .75s ease-in-out infinite}
.s-kick .arm-l,.s-kick .arm-r{animation:cc-punch .375s ease-in-out infinite}
.s-tinker .arm-r{animation:cc-tinker .3s ease-in-out infinite alternate}
.s-spin .anim{animation:cc-spin .45s linear infinite}
.s-sniff .head{animation:cc-sniff .25s ease-in-out infinite alternate}
.s-sniff .leg-l{animation:cc-swing-s .6s ease-in-out infinite alternate}
.s-sniff .leg-r{animation:cc-swing-s .6s ease-in-out infinite alternate-reverse}
.s-highfive .arm-r{transform:rotate(-135deg)}
.s-hug .arm-l{transform:rotate(-40deg)}
.s-hug .arm-r{transform:rotate(40deg)}
.s-pat .arm-r{animation:cc-pat .3s ease-in-out infinite alternate}
.s-pet .arm-r{animation:cc-pet .3s ease-in-out infinite alternate}
.s-shake .anim{animation:cc-bob .12s linear infinite}

/* custom image skins */
.skinned.s-walk .anim,.skinned.s-sneak .anim{animation:cc-waddle .42s ease-in-out infinite}
.skinned.s-run .anim{animation:cc-waddle .22s ease-in-out infinite}
.skinned.s-sit .anim{transform:scaleY(.86)}
.skinned.s-sleep .anim{transform:rotate(-80deg) translateX(-30%)}
.skinned.s-held .anim{animation:cc-waddle .5s ease-in-out infinite}
.skinned.s-climb .anim{animation:cc-waddle .3s ease-in-out infinite}
.skinned.s-kick .anim,.skinned.s-tinker .anim{animation:cc-dance .5s ease-in-out infinite}
.face-emoji{display:none;position:absolute;right:-6px;top:-6px;font-size:16px;line-height:1}
.skinned .face-emoji{display:block}

/* bubbles */
.emote,.say{position:absolute;display:none;pointer-events:none;background:#fff;color:#2a2230;
  border:2px solid #2a2230;box-shadow:0 2px 0 rgba(0,0,0,.18)}
.emote.show,.say.show{display:block;animation:cc-pop .18s ease-out}
.emote{left:78%;bottom:88%;border-radius:12px 12px 12px 3px;padding:1px 5px;font-size:17px;line-height:1.25;
  white-space:nowrap}
.say{left:50%;bottom:calc(100% + 8px);transform:translateX(calc(-50% + var(--dx,0px)));border-radius:12px;
  padding:4px 9px;font-size:12.5px;font-weight:600;line-height:1.3;width:max-content;max-width:190px;
  text-align:center}
.say::after{content:"";position:absolute;left:calc(50% - var(--dx,0px));top:100%;margin-left:-6px;
  border:6px solid transparent;border-top-color:#2a2230}
.below .say{bottom:auto;top:calc(100% + 8px)}
.below .say::after{top:auto;bottom:100%;border-top-color:transparent;border-bottom-color:#2a2230}
.below .emote{bottom:auto;top:40%}
.tag{position:absolute;left:50%;top:100%;margin-top:3px;transform:translateX(-50%);padding:1px 7px;
  border-radius:8px;background:rgba(42,34,48,.85);color:#fff;font-size:11px;font-weight:600;white-space:nowrap;
  opacity:0;transition:opacity .15s;pointer-events:none}
.char:hover .tag{opacity:1}
.char.held .tag,.char.on-floor .tag{opacity:0}
.char.on-floor:hover .tag{opacity:1;top:auto;bottom:100%;margin:0 0 3px}
.particle{position:absolute;pointer-events:none;font-size:15px;line-height:1}
`;
})();
