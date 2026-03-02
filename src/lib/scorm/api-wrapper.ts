/**
 * SCORM 1.2 API wrapper - finds LMS API and provides stub if not in LMS.
 * Include in package and reference from index.html for completion/score.
 */
export function getScorm12ApiWrapper(): string {
  return `(function () {
  var API = null;
  var findAPI = function(win) {
    var findAttempts = 0;
    var findAttemptLimit = 500;
    while (win.API == null && win.parent != null && win.parent != win && findAttempts < findAttemptLimit) {
      findAttempts++;
      win = win.parent;
    }
    return win.API;
  };
  API = findAPI(window);
  if (API == null && window.opener != null) API = findAPI(window.opener);
  if (API == null) {
    API = {
      LMSInitialize: function() { return "true"; },
      LMSFinish: function() { return "true"; },
      LMSGetValue: function() { return ""; },
      LMSSetValue: function() { return "true"; },
      LMSCommit: function() { return "true"; },
      LMSGetLastError: function() { return "0"; },
      LMSGetErrorString: function() { return ""; },
      LMSGetDiagnostic: function() { return ""; }
    };
  }
  window.API = API;
  if (typeof window.InitSCORM !== "undefined") window.InitSCORM(API);
})();
`;
}

/** Script that initializes SCORM, sets completion, and commits on unload. */
export function getScormCompletionScript(): string {
  return `
(function() {
  function init() {
    if (window.API && window.API.LMSInitialize) {
      window.API.LMSInitialize("");
    }
  }
  function setComplete() {
    if (window.API && window.API.LMSSetValue) {
      window.API.LMSSetValue("cmi.core.lesson_status", "completed");
      if (window.API.LMSCommit) window.API.LMSCommit("");
    }
  }
  function finish() {
    if (window.API && window.API.LMSFinish) window.API.LMSFinish("");
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  window.addEventListener("beforeunload", function() { setComplete(); finish(); });
})();
`;
}
