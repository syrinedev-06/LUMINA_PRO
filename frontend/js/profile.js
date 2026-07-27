async function showProfile() {
    if (window.innerWidth <= 900) toggleSidebar();

    setActiveLink('nav-profile');
    document.getElementById('page-title').innerText = "Statistiques";

    const zone = document.getElementById('content-area');
    zone.innerHTML = '<p style="padding:40px; color:var(--text-muted);">Chargement...</p>';

    try {
        const [resTasks, resUsers, resLogStats] = await Promise.all([
            authFetch('http://localhost:3000/api/tasks'),
            authFetch('http://localhost:3000/api/users'),
            authFetch('http://localhost:3000/api/logs/stats')
        ]);
        const tasks = await resTasks.json();
        const users = await resUsers.json();
        const logStats = await resLogStats.json();

        const total        = tasks.length;
        const urgentes     = tasks.filter(t => t.priority === 'high').length;
        const moyennes     = tasks.filter(t => t.priority === 'medium').length;
        const normales     = tasks.filter(t => t.priority === 'low').length;
        const nonAssignees = tasks.filter(t => !t.id_assigned).length;
        const membres      = users.length;
        const tachesSupprimees = logStats.tasksDeleted || 0;
        const membresRetires   = logStats.membersRemoved || 0;

        const pU = total > 0 ? Math.round(urgentes / total * 100) : 0;
        const pM = total > 0 ? Math.round(moyennes  / total * 100) : 0;
        const pN = total > 0 ? 100 - pU - pM : 100;

        // Construit le camembert SVG avant d'injecter le HTML
        const svgPie = creerCamembert(urgentes, moyennes, normales, total);

        // Petite fabrique pour éviter de répéter 6 fois le même gros bloc HTML
        const statCard = (icon, bg, color, value, label) => `
      <div class="stat-card" style="background:var(--card-bg);border-radius:16px;padding:20px;box-shadow:0 2px 12px rgba(0,0,0,0.06);display:flex;align-items:center;gap:14px;border-top:3px solid ${color};transition:transform .15s ease, box-shadow .15s ease;">
        <div style="width:46px;height:46px;flex-shrink:0;background:${bg};border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:21px;" aria-hidden="true">${icon}</div>
        <div style="min-width:0;">
          <div style="font-size:26px;font-weight:800;color:${color};line-height:1.1;">${value}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">${label}</div>
        </div>
      </div>`;

        zone.innerHTML = `
<div style="padding:32px;max-width:1000px;margin:0 auto;">

  <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">
    <span style="font-size:22px;" aria-hidden="true">📊</span>
    <h2 style="font-size:22px;">Tableau de bord</h2>
  </div>
  <p style="color:var(--text-muted);font-size:13px;margin-bottom:26px;">Vue d'ensemble du projet Lumina Pro</p>

  <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:16px;margin-bottom:20px;">
    ${statCard('📋', '#ede9fe', '#6c63ff', total, 'Tâches au total')}
    ${statCard('🔥', '#fee2e2', '#ef4444', urgentes, 'Tâches urgentes')}
    ${statCard('⏳', '#fef3c7', '#f59e0b', nonAssignees, 'Sans assignation')}
    ${statCard('👥', '#dcfce7', '#10b981', membres, 'Membres')}
    ${statCard('🗑️', '#f1f5f9', '#64748b', tachesSupprimees, 'Tâches supprimées')}
    ${statCard('👤', '#f1f5f9', '#64748b', membresRetires, 'Membres retirés')}
  </div>

  <div style="background:var(--card-bg);border-radius:16px;padding:28px 32px;box-shadow:0 2px 12px rgba(0,0,0,0.06);display:flex;align-items:center;gap:36px;flex-wrap:wrap;">
    <div style="display:flex;flex-direction:column;align-items:center;gap:14px;">
      <div style="font-size:14px;font-weight:700;color:var(--text);">Répartition par priorité</div>
      ${svgPie}
    </div>
    <div style="display:flex;flex-direction:column;gap:14px;flex:1;min-width:180px;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 14px;background:#fef2f2;border-radius:10px;">
        <span style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;"><span style="width:10px;height:10px;border-radius:50%;background:#ef4444;display:inline-block;"></span> Urgent</span>
        <span style="font-size:13px;color:#7f1d1d;font-weight:700;">${urgentes} <span style="opacity:.7;font-weight:500;">(${pU}%)</span></span>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 14px;background:#fffbeb;border-radius:10px;">
        <span style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;"><span style="width:10px;height:10px;border-radius:50%;background:#f59e0b;display:inline-block;"></span> Moyen</span>
        <span style="font-size:13px;color:#78350f;font-weight:700;">${moyennes} <span style="opacity:.7;font-weight:500;">(${pM}%)</span></span>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 14px;background:#f0fdf4;border-radius:10px;">
        <span style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;"><span style="width:10px;height:10px;border-radius:50%;background:#10b981;display:inline-block;"></span> Normal</span>
        <span style="font-size:13px;color:#14532d;font-weight:700;">${normales} <span style="opacity:.7;font-weight:500;">(${pN}%)</span></span>
      </div>
    </div>
  </div>
</div>
<style>
  .stat-card:hover { transform:translateY(-2px); box-shadow:0 6px 18px rgba(0,0,0,0.1); }
  @media (max-width:700px) { #content-area div[style*="grid-template-columns:repeat(3"] { grid-template-columns:repeat(2,1fr) !important; } }
</style>`;

    } catch (e) {
        zone.innerHTML = '<p style="padding:40px;color:red;">Erreur : ' + e.message + '</p>';
    }
}

function creerCamembert(urgentes, moyennes, normales, total) {
    const cx = 80;
    const cy = 80;
    const r  = 75;

    if (total === 0) {
        return '<svg width="160" height="160">'
            + '<circle cx="80" cy="80" r="75" fill="#e2e8f0"/>'
            + '<text x="80" y="85" text-anchor="middle" fill="#475569" font-size="12">Aucune tâche</text>'
            + '</svg>';
    }

    const parts = [
        { count: urgentes, color: '#ef4444' },
        { count: moyennes, color: '#f59e0b' },
        { count: normales, color: '#10b981' }
    ];

    let startAngle = -Math.PI / 2;
    let svgContent = '';

    parts.forEach(function(part) {
        if (part.count === 0) return;

        // angle de la part = (nombre / total) × 2π
        const angle = (part.count / total) * 2 * Math.PI;
        const endAngle = startAngle + angle;

        // points de départ et de fin sur le cercle
        const x1 = (cx + r * Math.cos(startAngle)).toFixed(2);
        const y1 = (cy + r * Math.sin(startAngle)).toFixed(2);
        const x2 = (cx + r * Math.cos(endAngle)).toFixed(2);
        const y2 = (cy + r * Math.sin(endAngle)).toFixed(2);

        // grand arc si la part dépasse 180°
        const largeArc = angle > Math.PI ? 1 : 0;

        // position du chiffre au milieu de la part
        const mid = startAngle + angle / 2;
        const tx = Math.round(cx + r * 0.6 * Math.cos(mid));
        const ty = Math.round(cy + r * 0.6 * Math.sin(mid));

        svgContent += '<path d="M ' + cx + ' ' + cy
            + ' L ' + x1 + ' ' + y1
            + ' A ' + r + ' ' + r + ' 0 ' + largeArc + ' 1 ' + x2 + ' ' + y2
            + ' Z" fill="' + part.color + '" stroke="white" stroke-width="2"/>';

        svgContent += '<text x="' + tx + '" y="' + (ty + 5)
            + '" text-anchor="middle" fill="white" font-size="16" font-weight="bold">'
            + part.count + '</text>';

        startAngle = endAngle;
    });

    return '<svg width="160" height="160">' + svgContent + '</svg>';
}
