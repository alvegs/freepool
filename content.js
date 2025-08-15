// content.js
(async () => {
  // 1) <<< PASTE YOUR DRAFTED NAMES HERE >>> (exact FPL names)
  const drafted = draftedPlayers;
  console.log(drafted);

  // 2) Fetch the live 25/26 player + team metadata from FPL
  // (Contains all registered players incl. official new signings as they’re added)
  const res = await fetch(
    "https://fantasy.premierleague.com/api/bootstrap-static/"
  );
  const data = await res.json();

  const teamsById = new Map(data.teams.map((t) => [t.id, t.name]));
  // element_type: 1 GK, 2 DEF, 3 MID, 4 FWD
  const typeToBucket = {
    1: "keepers",
    2: "defenders",
    3: "midfielders",
    4: "forwards",
  };

  // 3) Build a structure for all clubs
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

  // 4) Add players by club/position, excluding your drafted list
  for (const p of data.elements) {
    const name = `${p.first_name} ${p.second_name}`.replace(/\s+/g, " ").trim();
    if (draftedPlayers.includes(name)) continue; // exclude drafted

    const clubName = teamsById.get(p.team);
    const bucket = typeToBucket[p.element_type];
    if (!clubName || !bucket) continue;

    clubs[clubName][bucket].push(name);
  }

  // 5) Final array
  const unselectedPlayers = Object.values(clubs);

  // Make it easy to grab:
  window.unselectedPlayers = unselectedPlayers;
  console.log("unselectedPlayers =", unselectedPlayers);

  // Optional: render a small panel you can copy from
  const panel = document.createElement("div");
  panel.style.position = "fixed";
  panel.style.top = "12px";
  panel.style.right = "12px";
  panel.style.zIndex = "999999";
  panel.style.background = "white";
  panel.style.border = "1px solid #ddd";
  panel.style.borderRadius = "12px";
  panel.style.padding = "12px";
  panel.style.maxWidth = "420px";
  panel.style.maxHeight = "60vh";
  panel.style.overflow = "auto";
  panel.style.font =
    "12px/1.4 system-ui, -apple-system, Segoe UI, Roboto, Arial";
  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px">
      <strong>Free Pool (auto-generated)</strong>
      <button id="copyUnsel" style="padding:6px 10px;border:1px solid #ccc;border-radius:8px;background:#f5f5f5;cursor:pointer">Copy JSON</button>
    </div>
    <pre style="white-space:pre-wrap">${JSON.stringify(
      unselectedPlayers,
      null,
      2
    )}</pre>
  `;
  document.body.appendChild(panel);
  panel.querySelector("#copyUnsel").onclick = async () => {
    await navigator.clipboard.writeText(
      `const unselectedPlayers = ${JSON.stringify(unselectedPlayers, null, 2)};`
    );
    panel.querySelector("#copyUnsel").textContent = "Copied!";
    setTimeout(
      () => (panel.querySelector("#copyUnsel").textContent = "Copy JSON"),
      1200
    );
  };
})();
