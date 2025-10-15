from __future__ import annotations

from base64 import b64decode
from io import BytesIO
from typing import List
from xml.etree import ElementTree as ET
from xml.sax.saxutils import escape
from zipfile import ZipFile, ZIP_DEFLATED

MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"

SNAPSHOT_TEMPLATE_B64 = (
    "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"
)


def snapshot_template_bytes() -> bytes:
    return b64decode(SNAPSHOT_TEMPLATE_B64)


def build_workbook_from_rows(rows: List[List[str]]) -> bytes:
    base = snapshot_template_bytes()
    sheet_xml = _render_sheet_xml(rows)
    output = BytesIO()
    with ZipFile(BytesIO(base)) as src, ZipFile(output, mode="w", compression=ZIP_DEFLATED) as dst:
        for name in src.namelist():
            if name == "xl/worksheets/sheet1.xml":
                dst.writestr(name, sheet_xml.encode("utf-8"))
            else:
                dst.writestr(name, src.read(name))
    return output.getvalue()


def extract_rows_from_workbook(data: bytes) -> List[List[str]]:
    with ZipFile(BytesIO(data)) as archive:
        sheet_path = _resolve_first_sheet_path(archive)
        sheet_xml = archive.read(sheet_path)
        shared_strings = _parse_shared_strings(archive)
    root = ET.fromstring(sheet_xml)
    rows: List[List[str]] = []
    for row in root.findall(f"{{{MAIN_NS}}}sheetData/{{{MAIN_NS}}}row"):
        values: dict[int, str] = {}
        max_col = 0
        for cell in row.findall(f"{{{MAIN_NS}}}c"):
            ref = cell.attrib.get("r", "")
            col_letters = "".join(ch for ch in ref if ch.isalpha())
            if not col_letters:
                continue
            col_idx = _column_index(col_letters)
            max_col = max(max_col, col_idx)
            values[col_idx] = _extract_cell_value(cell, shared_strings)
        if max_col == 0:
            continue
        row_values = ["" for _ in range(max_col)]
        for col_idx, value in values.items():
            row_values[col_idx - 1] = value
        rows.append(row_values)
    return rows


def _resolve_first_sheet_path(archive: ZipFile) -> str:
    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    sheets_node = workbook.find(f"{{{MAIN_NS}}}sheets")
    if sheets_node is None:
        return "xl/worksheets/sheet1.xml"
    first_sheet = sheets_node.find(f"{{{MAIN_NS}}}sheet")
    if first_sheet is None:
        return "xl/worksheets/sheet1.xml"
    rel_id = first_sheet.attrib.get(f"{{{REL_NS}}}id")
    if not rel_id:
        return "xl/worksheets/sheet1.xml"
    rels = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    for rel in rels.findall(f"{{{REL_NS}}}Relationship"):
        if rel.attrib.get("Id") == rel_id:
            target = rel.attrib.get("Target", "worksheets/sheet1.xml")
            if target.startswith("/"):
                target = target.lstrip("/")
            if not target.startswith("xl/"):
                target = f"xl/{target}"
            return target
    return "xl/worksheets/sheet1.xml"


def _parse_shared_strings(archive: ZipFile) -> List[str]:
    if "xl/sharedStrings.xml" not in archive.namelist():
        return []
    root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    strings: List[str] = []
    for si in root.findall(f"{{{MAIN_NS}}}si"):
        parts = []
        for text_node in si.findall(f".//{{{MAIN_NS}}}t"):
            parts.append(text_node.text or "")
        strings.append("".join(parts))
    return strings


def _extract_cell_value(cell: ET.Element, shared_strings: List[str]) -> str:
    cell_type = cell.attrib.get("t")
    if cell_type == "s":
        value = cell.find(f"{{{MAIN_NS}}}v")
        if value is None or value.text is None:
            return ""
        try:
            return shared_strings[int(value.text)]
        except (ValueError, IndexError):
            return ""
    if cell_type == "inlineStr":
        texts = [node.text or "" for node in cell.findall(f".//{{{MAIN_NS}}}t")]
        return "".join(texts)
    value = cell.find(f"{{{MAIN_NS}}}v")
    return value.text.strip() if value is not None and value.text is not None else ""


def _render_sheet_xml(rows: List[List[str]]) -> str:
    if not rows:
        rows = [[""]]
    row_xml_parts = []
    max_col = 0
    for r_idx, row in enumerate(rows, start=1):
        cells = []
        for c_idx, value in enumerate(row, start=1):
            max_col = max(max_col, c_idx)
            if value in (None, ""):
                continue
            ref = f"{_column_letter(c_idx)}{r_idx}"
            text = escape(str(value))
            cells.append(f'<c r="{ref}" t="inlineStr"><is><t>{text}</t></is></c>')
        row_xml_parts.append(f'<row r="{r_idx}">{"".join(cells)}</row>')
    if max_col == 0:
        max_col = 1
    dimension = f"A1:{_column_letter(max_col)}{len(rows)}"
    sheet_data = "".join(row_xml_parts)
    return (
        f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        f'<worksheet xmlns="{MAIN_NS}">'
        f'<dimension ref="{dimension}" />'
        f'<sheetViews><sheetView workbookViewId="0">'
        f'<selection activeCell="A1" sqref="A1" />'
        f"</sheetView></sheetViews>"
        f'<sheetFormatPr baseColWidth="8" defaultRowHeight="15" />'
        f"<sheetData>{sheet_data}</sheetData>"
        f'<pageMargins left="0.75" right="0.75" top="1" bottom="1" header="0.5" footer="0.5" />'
        f"</worksheet>"
    )


def _column_letter(index: int) -> str:
    result = ""
    while index > 0:
        index, remainder = divmod(index - 1, 26)
        result = chr(65 + remainder) + result
    return result or "A"


def _column_index(letters: str) -> int:
    result = 0
    for char in letters.upper():
        if "A" <= char <= "Z":
            result = result * 26 + (ord(char) - ord("A") + 1)
    return max(result, 1)
