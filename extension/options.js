chrome.storage.local.get(["vaultUrl", "apiToken"], (config) => {
  if (config.vaultUrl) document.getElementById("vaultUrl").value = config.vaultUrl;
  if (config.apiToken) document.getElementById("apiToken").value = config.apiToken;
});

document.getElementById("save").addEventListener("click", () => {
  const vaultUrl = document.getElementById("vaultUrl").value.replace(/\/$/, "");
  const apiToken = document.getElementById("apiToken").value.trim();
  chrome.storage.local.set({ vaultUrl, apiToken }, () => {
    document.getElementById("saved").style.display = "block";
    setTimeout(() => (document.getElementById("saved").style.display = "none"), 2000);
  });
});
