// content.js
(async () => {
  const drafted = draftedPlayers; // your drafted players list
  console.log(drafted);

  // Fetch live 25/26 player + team metadata from FPL
  const res = await fetch(
    "https://fantasy.premierleague.com/api/bootstrap-static/"
  );
  const data = await res.json();

  const teamsById = new Map(data.teams.map((t) => [t.id, t.name]));
  const typeToBucket = {
    1: "keepers",
    2: "defenders",
    3: "midfielders",
    4: "forwards",
  };

  // Build a structure for all clubs
  const clubs = {};
  for (const t of data.teams) {
    clubs[t.name] = {
      club: t.name,
      keepers: [],
      defenders: [],
      midfielders: [],
      forwards: [],
    };
  }

  // Add players by club/position, mark drafted players
  for (const p of data.elements) {
    const name = `${p.first_name} ${p.second_name}`.replace(/\s+/g, " ").trim();
    const isDrafted = drafted.includes(name);

    const clubName = teamsById.get(p.team);
    const bucket = typeToBucket[p.element_type];
    if (!clubName || !bucket) continue;

    clubs[clubName][bucket].push({ name, drafted: isDrafted });
  }

  // Final array
  const allPlayersByClub = Object.values(clubs);

  // Make it globally available
  window.allPlayersByClub = allPlayersByClub;
  console.log("allPlayersByClub =", allPlayersByClub);

  // Render panel
  const panel = document.createElement("div");
  panel.style.position = "fixed";
  panel.style.top = "12px";
  panel.style.right = "12px";
  panel.style.zIndex = "999999";
  panel.style.background = "#1e1e1e";
  panel.style.border = "1px solid #444";
  panel.style.borderRadius = "12px";
  panel.style.padding = "12px";
  panel.style.maxWidth = "480px";
  panel.style.maxHeight = "70vh";
  panel.style.overflow = "auto";
  panel.style.color = "#fff";
  panel.style.font =
    "12px/1.5 system-ui, -apple-system, Segoe UI, Roboto, Arial";

  const copyBtnId = "copyAllPlayersBtn";

  const generateHTML = () => {
    return allPlayersByClub
      .map((club) => {
        let html = `<div style="margin-bottom:12px"><strong style="font-size:14px;border-bottom:1px solid #666;display:block;margin-bottom:4px">${club.club}</strong>`;
        for (const [bucket, players] of Object.entries(club)) {
          if (bucket === "club" || players.length === 0) continue;
          html += `<div style="margin-left:10px;margin-bottom:4px"><strong style="text-transform:capitalize">${bucket}:</strong> `;
          html += players
            .map((p) =>
              p.drafted
                ? `<span style="text-decoration:line-through;color:#888">${p.name}</span>`
                : `<span>${p.name}</span>`
            )
            .join(", ");
          html += `</div>`;
        }
        html += `</div>`;
        return html;
      })
      .join("");
  };

  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px">
      <strong>Players (Drafted crossed out)</strong>
      <button id="${copyBtnId}" style="padding:6px 10px;border:1px solid #ccc;border-radius:8px;background:#333;color:#fff;cursor:pointer">Copy JSON</button>
    </div>
    <div style="max-height:60vh;overflow:auto">${generateHTML()}</div>
  `;

  document.body.appendChild(panel);

  // Copy button functionality
  panel.querySelector(`#${copyBtnId}`).onclick = async () => {
    await navigator.clipboard.writeText(
      `const allPlayersByClub = ${JSON.stringify(allPlayersByClub, null, 2)};`
    );
    panel.querySelector(`#${copyBtnId}`).textContent = "Copied!";
    setTimeout(
      () => (panel.querySelector(`#${copyBtnId}`).textContent = "Copy JSON"),
      1200
    );
  };
})();
