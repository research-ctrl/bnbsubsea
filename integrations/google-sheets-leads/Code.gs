/**
 * Bennet and Bernard Subsea: website "Let's talk" leads into this sheet.
 * Paste into the sheet "Website Leads — Let's Talk" (Extensions → Apps Script).
 * Optional: a script property LEADS_SECRET; if set, the website must send the same value (LEADS_WEBHOOK_SECRET).
 */
const SPREADSHEET_ID = '1szUCHJ-MsaLnV_9c02cToBb_FTcbhp8V_PKOZOVexUw';
const SHEET_NAME = 'Leads';
const LIMITS = { reference: 64, name: 120, email: 254, interest: 120, message: 5000, source: 200 };

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const secret = PropertiesService.getScriptProperties().getProperty('LEADS_SECRET');
    if (secret && body.secret !== secret) return json_({ ok: false, error: 'unauthorised' });

    const v = {};
    Object.keys(LIMITS).forEach(function (k) { v[k] = clean_(body[k], LIMITS[k]); });
    if (!v.name || !v.email || !v.message) return json_({ ok: false, error: 'missing fields' });

    let received = new Date(body.receivedAt);
    if (isNaN(received.getTime())) received = new Date();

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
      // Received | Reference | Name | Email | Enquiry about | Message | Source | Status | Assigned to | Follow-up date | Notes
      sheet.appendRow([received, v.reference, v.name, v.email, v.interest, v.message,
        v.source || "Website — Let's talk", 'New', '', '', '']);
    } finally {
      lock.releaseLock();
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: 'server error' });
  }
}

/** Trim, cap the length, and stop text being read as a spreadsheet formula. */
function clean_(value, max) {
  let s = (value === undefined || value === null) ? '' : String(value).trim().slice(0, max);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
