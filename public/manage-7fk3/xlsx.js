/* Minimal .xlsx writer for the admin: one sheet, a bold header row, text and
   number cells. Builds the ZIP (stored, no compression) in the browser, so no
   library or server extension is needed. */
(function () {
  'use strict';

  const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
    return table;
  })();

  function crc32(bytes) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function zip(files) {
    const enc = new TextEncoder();
    const parts = [];
    const central = [];
    let offset = 0;
    files.forEach(({ name, data }) => {
      const nameBytes = enc.encode(name);
      const body = typeof data === 'string' ? enc.encode(data) : data;
      const crc = crc32(body);
      const local = new DataView(new ArrayBuffer(30));
      local.setUint32(0, 0x04034b50, true);
      local.setUint16(4, 20, true);
      local.setUint16(6, 0x0800, true);          // UTF-8 names
      local.setUint16(8, 0, true);               // stored
      local.setUint32(14, crc, true);
      local.setUint32(18, body.length, true);
      local.setUint32(22, body.length, true);
      local.setUint16(26, nameBytes.length, true);
      parts.push(new Uint8Array(local.buffer), nameBytes, body);

      const entry = new DataView(new ArrayBuffer(46));
      entry.setUint32(0, 0x02014b50, true);
      entry.setUint16(4, 20, true);
      entry.setUint16(6, 20, true);
      entry.setUint16(8, 0x0800, true);
      entry.setUint32(16, crc, true);
      entry.setUint32(20, body.length, true);
      entry.setUint32(24, body.length, true);
      entry.setUint16(28, nameBytes.length, true);
      entry.setUint32(42, offset, true);
      central.push(new Uint8Array(entry.buffer), nameBytes);
      offset += 30 + nameBytes.length + body.length;
    });
    const centralSize = central.reduce((n, p) => n + p.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, files.length, true);
    end.setUint16(10, files.length, true);
    end.setUint32(12, centralSize, true);
    end.setUint32(16, offset, true);
    const all = parts.concat(central, [new Uint8Array(end.buffer)]);
    const out = new Uint8Array(all.reduce((n, p) => n + p.length, 0));
    let at = 0;
    all.forEach(p => { out.set(p, at); at += p.length; });
    return out;
  }

  // Characters XML 1.0 cannot carry at all are dropped.
  const esc = s => String(s)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function colName(i) {
    let s = '';
    for (i += 1; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + ((i - 1) % 26)) + s;
    return s;
  }

  function cell(ref, value, style) {
    const s = style ? ` s="${style}"` : '';
    if (value === null || value === undefined || value === '') return '';
    if (typeof value === 'number' && isFinite(value)) return `<c r="${ref}"${s}><v>${value}</v></c>`;
    return `<c r="${ref}" t="inlineStr"${s}><is><t xml:space="preserve">${esc(value)}</t></is></c>`;
  }

  // columns: [{ title, width, money }], rows: arrays of values in the same order.
  // A money column shows numbers with thousands separators and two decimals.
  function build(sheetName, columns, rows) {
    const cols = columns.map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${c.width || 16}" customWidth="1"/>`).join('');
    const head = `<row r="1">${columns.map((c, i) => cell(colName(i) + '1', c.title, 1)).join('')}</row>`;
    const body = rows.map((r, ri) =>
      `<row r="${ri + 2}">${r.map((v, ci) => cell(colName(ci) + (ri + 2), v, columns[ci].money ? 2 : 0)).join('')}</row>`).join('');
    const sheet = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
      + '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'
      + `<cols>${cols}</cols><sheetData>${head}${body}</sheetData>`
      + `<autoFilter ref="A1:${colName(columns.length - 1)}${rows.length + 1}"/></worksheet>`;
    const files = [
      { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        + '<Default Extension="xml" ContentType="application/xml"/>'
        + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
        + '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
        + '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
        + '</Types>' },
      { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
        + '</Relationships>' },
      { name: 'xl/workbook.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        + `<sheets><sheet name="${esc(sheetName).slice(0, 31)}" sheetId="1" r:id="rId1"/></sheets>`
        + `<definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">'${esc(sheetName).slice(0, 31)}'!$A$1:$${colName(columns.length - 1)}$${rows.length + 1}</definedName></definedNames>`
        + '</workbook>' },
      { name: 'xl/_rels/workbook.xml.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
        + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
        + '</Relationships>' },
      { name: 'xl/styles.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        + '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>'
        + '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>'
        + '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
        + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
        + '<cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs>'
        + '</styleSheet>' },
      { name: 'xl/worksheets/sheet1.xml', data: sheet },
    ];
    return zip(files);
  }

  const root = typeof window !== 'undefined' ? window : globalThis;
  root.ThemeliXlsx = { build };
})();
