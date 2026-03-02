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
