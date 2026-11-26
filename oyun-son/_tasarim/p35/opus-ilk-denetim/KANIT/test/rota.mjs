// H-P35-05: Avcı Seferi aday rotalarının (havuzun ikiye bölünmesi) gerçek ayrışması. Savaş simüle edilmez; yalnız kaynak verisi.
const R = process.argv[2]; const Z = await import(R + '/shared/zones.js'), C = await import(R + '/shared/content.js');
const out = [];
for (const z of Z.ZONES) {
  const pool = [...new Set(Z.zoneNormals(z))].filter(id => Z.MOBS[id] && !Z.MOBS[id].boss && !Z.MOBS[id].tut);
  const mid = Math.ceil(pool.length / 2), A = pool.slice(0, mid), B = pool.slice(mid);
  const lvl = Math.min(65, Math.max(25, z.lv[1] - 2));
  const g = ids => { const u = ids.map(id => Z.mobUnit(id, lvl, 'n')); const m = k => Math.round(u.reduce((a, x) => a + (x[k] || 0), 0) / u.length);
    const el = {}; ids.forEach(id => { const w = Z.MOBS[id].weak || '-'; el[w] = (el[w] || 0) + 1; }); return { n: ids.length, hp: m('maxHp'), atk: m('atk'), def: m('def'), spd: m('spd'), zayif: el, ad: ids.map(id => Z.MOBS[id].name).slice(0, 6) }; };
  out.push({ bolge: z.id, ad: z.name, seviye: z.lv, olcum_lvl: lvl, havuz: pool.length, A: g(A), B: g(B) });
}
console.log(JSON.stringify(out, null, 1));
