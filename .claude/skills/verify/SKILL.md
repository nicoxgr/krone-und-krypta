# Verify: Krone & Krypta

Reines Static-Site-Spiel (index.html + style.css + script.js, kein Build).

## Starten

- Browser-Pane: `preview_start` mit Config `krone-und-krypta` aus `~/Claude/.claude/launch.json`
  (python3 http.server auf Port 8321, --directory auf dieses Repo).
- **Nicht über `file://` testen** — der Browser-Pane lädt dort keine Subressourcen nach (CSS/JS fehlen).
- Viewport: `resize_window` auf 1280×720; Screenshots sind 800×450 (Faktor 0,625 —
  Drag-Distanzen entsprechend umrechnen: 110 Screenshot-px ≈ 176 echte px > Swipe-Schwellwert).

## Gotchas

- **Cache:** python http.server sendet keine Cache-Header; nach Datei-Edits im Tab ausführen:
  `Promise.all([fetch('script.js',{cache:'reload'}), fetch('style.css',{cache:'reload'})]).then(()=>location.reload())`
- **Hidden-Tab:** Der Pane meldet `document.visibilityState === 'hidden'`. `wait()` im Spiel
  löst dann sofort auf (eingebauter Guard) — Runden resolven ohne Animations-Delays. Nicht wundern.

## Treiben

- Karte liegt mittig ≈ (400, 245) im Screenshot. Swipes: `left_click_drag` ±110 px X
  (links/rechts) bzw. ±105 px Y (oben/unten, nur im COMBAT-Modus).
- Debug-Hook `window.__kk` (nur Dev): `.state`, `.enterDungeon(id)`, `.next()` (dungeonContinue),
  `.fight(id, opts)`, `.win()`, `.die(key)`, `.gold(n)`, `.hp(n)`.
  Schnellpfad Boss: `enterDungeon('katakomben'); state.dungeon.level=3; next()` → Vorkammer → Boss.

## Prüfen

- Kein Scrollbalken: `scrollWidth===clientWidth && scrollHeight===clientHeight` auf documentElement.
- Kern-Loop: Story-Swipe → Portal (ab Tag 3) → Weggabelung → Raum → Kampf (4 Richtungen,
  Fokus-/Trank-Validierung per Spring-Back + Toast) → Reward → Boss → zurück in STORY.
- Konsole muss leer bleiben (`read_console_messages onlyErrors`).
