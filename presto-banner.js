
document.addEventListener("DOMContentLoaded", () => {
  const mercatoBtn = document.querySelector('[data-page="mercato"], .mercato-btn');
  if (!mercatoBtn) return;

  mercatoBtn.addEventListener("click", (e) => {
    e.preventDefault();

    let existing = document.getElementById("presto-banner");
    if (existing) existing.remove();

    const banner = document.createElement("div");
    banner.id = "presto-banner";
    banner.innerText = "PRESTO";

    banner.style.position = "fixed";
    banner.style.top = "20px";
    banner.style.left = "50%";
    banner.style.transform = "translateX(-50%)";
    banner.style.background = "#c62828";
    banner.style.color = "#fff";
    banner.style.padding = "12px 24px";
    banner.style.fontSize = "20px";
    banner.style.fontWeight = "700";
    banner.style.borderRadius = "10px";
    banner.style.zIndex = "9999";
    banner.style.boxShadow = "0 0 0 transparent";

    document.body.appendChild(banner);

    setTimeout(() => {
      banner.remove();
    }, 2500);
  });
});
