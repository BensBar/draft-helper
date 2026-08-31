/* Same scrape + postMessage path as the bookmarklet. Load unpacked if bookmarks are blocked. */
(function () {
  var CHANNEL = "bensbar-draft-sync";
  var TYPE = "bensbar-draft-sync";
  var PAGES = { url: "https://bensbar.github.io/draft-helper/", origin: "https://bensbar.github.io" };

  function scrape() {
    var seen = {};
    var out = [];
    var picks = [];
    function add(n, ov) {
      n = (n || "").replace(/\s+/g, " ").trim();
      if (n.length < 3) return;
      var k = n.toLowerCase();
      if (seen[k]) return;
      if (/^(round|pick|overall|empty|kept|clock|draft|search|filter|team)$/i.test(n)) return;
      seen[k] = 1;
      out.push(n);
      picks.push({ name: n, overallPick: ov });
    }
    document
      .querySelectorAll(
        '[data-player-name],[data-fullname],.player-name,.playerName,.playername,a.playerLink,[class*="player-name"],[class*="playerName"]',
      )
      .forEach(function (el) {
        var n = el.getAttribute("data-player-name") || el.getAttribute("data-fullname") || el.textContent;
        var cell = el.closest("[data-pick],[data-overall-pick],[data-pick-number]");
        var ov =
          cell &&
          Number(
            cell.getAttribute("data-pick") ||
              cell.getAttribute("data-overall-pick") ||
              cell.getAttribute("data-pick-number"),
          );
        add(n, ov > 0 ? ov : undefined);
      });
    return { names: out, picks: picks };
  }

  function send() {
    var s = scrape();
    var msg = { type: TYPE, version: 1, source: "extension", names: s.names, picks: s.picks, href: location.href };
    try {
      new BroadcastChannel(CHANNEL).postMessage(msg);
    } catch (e) {}
    try {
      if (window.opener) {
        window.opener.postMessage(msg, PAGES.origin);
        window.opener.postMessage(msg, "http://localhost:3000");
      }
    } catch (e) {}
    try {
      var w = window.__bensbarCompanionWin;
      if (!w || w.closed) {
        w = window.open(PAGES.url, "bensbar-draft-helper");
        window.__bensbarCompanionWin = w;
      }
      if (w) w.postMessage(msg, PAGES.origin);
    } catch (e) {}
  }

  send();
  setInterval(send, 2000);
})();
