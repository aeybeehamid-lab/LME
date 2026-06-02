from pathlib import Path
from fpdf import FPDF


def build_pdf(source_md: Path, output_pdf: Path) -> None:
    text = source_md.read_text(encoding="utf-8")
    lines = text.splitlines()

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 18)
    pdf.multi_cell(0, 10, "LME Build Roadmap")
    pdf.ln(2)

    content_width = 180

    for line in lines:
        stripped = line.strip()
        stripped = stripped.encode("ascii", "ignore").decode("ascii")
        if not stripped:
            pdf.ln(2)
            continue
        if stripped.startswith("# "):
            pdf.set_font("Helvetica", "B", 16)
            pdf.multi_cell(content_width, 8, stripped[2:].strip())
        elif stripped.startswith("## "):
            pdf.set_font("Helvetica", "B", 13)
            pdf.multi_cell(content_width, 7, stripped[3:].strip())
        elif stripped.startswith("- "):
            pdf.set_font("Helvetica", "", 11)
            pdf.multi_cell(content_width, 6, f"- {stripped[2:].strip()}")
        else:
            pdf.set_font("Helvetica", "", 11)
            pdf.multi_cell(content_width, 6, stripped)

    output_pdf.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(output_pdf))


if __name__ == "__main__":
    root = Path(__file__).resolve().parent
    build_pdf(root / "roadmap.md", root / "roadmap.pdf")

