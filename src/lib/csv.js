// RFC 4180 CSV. 수식 주입(=,+,-,@로 시작)을 막으려 앞에 '를 붙인다.
export function toCsv(rows) {
  return rows
    .map((row) =>
      row
        .map((v) => {
          let s = v == null ? "" : String(v);
          if (/^[=+\-@]/.test(s)) s = "'" + s;
          return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    )
    .join("\r\n");
}
