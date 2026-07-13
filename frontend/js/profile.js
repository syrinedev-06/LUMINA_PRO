async function showProfile() {
    if (window.innerWidth <= 900) toggleSidebar();

    setActiveLink('nav-profile');
    document.getElementById('page-title').innerText = "Statistiques";

    const zone = document.getElementById('content-area');
    zone.innerHTML = '<p style="padding:40px; color:var(--text-muted);">Chargement...</p>';

    try {
        const [resTasks, resUsers] = await Promise.all([
            authFetch('http://localhost:3000/api/tasks'),
            authFetch('http://localhost:3000/api/users')
        ]);
        const tasks = await resTasks.json();
        const users = await resUsers.json();

        const total        = tasks.length;
        const urgentes     = tasks.filter(t => t.priority === 'high').length;
        const moyennes     = tasks.filter(t => t.priority === 'medium').length;
        const normales     = tasks.filter(t => t.priority === 'low').length;
        const nonAssignees = tasks.filter(t => !t.id_assigned).length;
        const membres      = users.length;

        const pU = total > 0 ? Math.round(urgentes / total * 100) : 0;
        const pM = total > 0 ? Math.round(moyennes  / total * 100) : 0;
        const pN = total > 0 ? 100 - pU - pM : 100;

        // Construit le camembert SVG avant d'injecter le HTML
        const svgPie = creerCamembert(urgentes, moyennes, normales, total);

        zone.innerHTML = `
<div style="padding:32px;max-width:900px;margin:0 auto;">

  <h2 style="font-size:22px;margin-bottom:4px;">Tableau de bord</h2>
  <p style="color:var(--text-muted);font-size:13px;margin-bottom:24px;">Vue d'ensemble du projet Lumina Pro</p>

  <div style="display:flex;gap:20px;align-items:flex-start;">

    <div style="display:flex;flex-direction:column;gap:16px;flex:1;">

      <div style="background:var(--card-bg);border-radius:14px;padding:20px;box-shadow:0 2px 10px rgba(0,0,0,0.07);display:flex;align-items:center;gap:14px;">
        <div style="width:44px;height:44px;background:#ede9fe;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;" aria-hidden="true">📋</div>
        <div>
          <div style="font-size:28px;font-weight:800;color:#6c63ff;">${total}</div>
          <div style="font-size:12px;color:var(--text-muted);">Tâches au total</div>
        </div>
      </div>

      <div style="background:var(--card-bg);border-radius:14px;padding:20px;box-shadow:0 2px 10px rgba(0,0,0,0.07);display:flex;align-items:center;gap:14px;">
        <div style="width:44px;height:44px;background:#fee2e2;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;" aria-hidden="true">🔥</div>
        <div>
          <div style="font-size:28px;font-weight:800;color:#ef4444;">${urgentes}</div>
          <div style="font-size:12px;color:var(--text-muted);">Tâches urgentes</div>
        </div>
      </div>

      <div style="background:var(--card-bg);border-radius:14px;padding:20px;box-shadow:0 2px 10px rgba(0,0,0,0.07);display:flex;align-items:center;gap:14px;">
        <div style="width:44px;height:44px;background:#fef3c7;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;" aria-hidden="true">⏳</div>
        <div>
          <div style="font-size:28px;font-weight:800;color:#f59e0b;">${nonAssignees}</div>
          <div style="font-size:12px;color:var(--text-muted);">Sans assignation</div>
        </div>
      </div>

      <div style="background:var(--card-bg);border-radius:14px;padding:20px;box-shadow:0 2px 10px rgba(0,0,0,0.07);display:flex;align-items:center;gap:14px;">
        <div style="width:44px;height:44px;background:#dcfce7;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;" aria-hidden="true">👥</div>
        <div>
          <div style="font-size:28px;font-weight:800;color:#10b981;">${membres}</div>
          <div style="font-size:12px;color:var(--text-muted);">Membres</div>
        </div>
      </div>

    </div>

    <div style="background:var(--card-bg);border-radius:14px;padding:28px;box-shadow:0 2px 10px rgba(0,0,0,0.07);flex:1;display:flex;flex-direction:column;align-items:center;gap:20px;">
      <div style="font-size:14px;font-weight:600;">Répartition par priorité</div>
      ${svgPie}
      <div style="display:flex;flex-direction:column;gap:10px;width:100%;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:12px;height:12px;border-radius:3px;background:#ef4444;"></div>
          <span style="font-size:13px;">Urgent — <b>${urgentes}</b> (${pU}%)</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:12px;height:12px;border-radius:3px;background:#f59e0b;"></div>
          <span style="font-size:13px;">Moyen — <b>${moyennes}</b> (${pM}%)</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:12px;height:12px;border-radius:3px;background:#10b981;"></div>
          <span style="font-size:13px;">Normal — <b>${normales}</b> (${pN}%)</span>
        </div>
      </div>
    </div>

  </div>
</div>`;

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
