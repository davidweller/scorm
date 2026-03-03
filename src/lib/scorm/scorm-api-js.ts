/**
 * SCORM 1.2 API wrapper script (to be served as scorm-api.js in the package).
 */
export const SCORM_API_JS = `
(function() {
  var API = null;
  function findAPI(win) {
    if (win.API) return win.API;
    if (win.parent && win.parent !== win) return findAPI(win.parent);
    return null;
  }
  API = findAPI(window);
  if (!API && window.opener) API = findAPI(window.opener);
  window.API = API;

  window.SCORM = {
    init: function() {
      if (!API) return false;
      try {
        API.LMSInitialize('');
        return true;
      } catch (e) { return false; }
    },
    setLessonStatus: function(status) {
      if (!API) return;
      try { API.LMSSetValue('cmi.core.lesson_status', status); API.LMSCommit(''); } catch (e) {}
    },
    getLessonStatus: function() {
      if (!API) return '';
      try { return API.LMSGetValue('cmi.core.lesson_status'); } catch (e) { return ''; }
    },
    setScore: function(score, min, max) {
      if (!API) return;
      try {
        API.LMSSetValue('cmi.core.score.raw', String(score));
        API.LMSSetValue('cmi.core.score.min', String(min));
        API.LMSSetValue('cmi.core.score.max', String(max));
        API.LMSCommit('');
      } catch (e) {}
    },
    setSuspendData: function(data) {
      if (!API) return;
      try { API.LMSSetValue('cmi.suspend_data', data); API.LMSCommit(''); } catch (e) {}
    },
    getSuspendData: function() {
      if (!API) return '';
      try { return API.LMSGetValue('cmi.suspend_data'); } catch (e) { return ''; }
    },
    setLocation: function(location) {
      if (!API) return;
      try { API.LMSSetValue('cmi.core.lesson_location', location); API.LMSCommit(''); } catch (e) {}
    },
    terminate: function() {
      if (!API) return;
      try { API.LMSFinish(''); } catch (e) {}
    }
  };
})();
`;
