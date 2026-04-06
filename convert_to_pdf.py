"""
FitBuddy - Markdown to PDF Converter
Converts all project documentation markdown files to styled PDF documents.
"""

import os
import markdown
from xhtml2pdf import pisa

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PDF_OUTPUT_DIR = os.path.join(BASE_DIR, "PDFs")
os.makedirs(PDF_OUTPUT_DIR, exist_ok=True)

# All markdown files to convert
MARKDOWN_FILES = [
    ("",                           "README.md",                    "00_README"),
    ("1_Ideation_Phase",           "Problem_Statement.md",         "01_Problem_Statement"),
    ("1_Ideation_Phase",           "Brainstorming.md",             "02_Brainstorming"),
    ("1_Ideation_Phase",           "Empathy_Map.md",               "03_Empathy_Map"),
    ("2_Requirement_Analysis",     "Requirement_Analysis.md",      "04_Requirement_Analysis"),
    ("3_Frontend_Development",     "Frontend_Documentation.md",    "05_Frontend_Documentation"),
    ("4_Backend_Development",      "Backend_Documentation.md",     "06_Backend_Documentation"),
    ("5_AI_ML_Integration",        "AI_ML_Integration.md",         "07_AI_ML_Integration"),
    ("6_System_Testing",           "Testing_Documentation.md",     "08_Testing_Documentation"),
    ("7_Deployment",               "Deployment_Guide.md",          "09_Deployment_Guide"),
    ("8_Project_Documentation",    "Project_Report.md",            "10_Project_Report"),
]

SUBTITLES = {
    "00_README":                 ("README - Project Overview",         "Setup, features, API reference and repository structure"),
    "01_Problem_Statement":      ("Problem Statement",                 "Ideation Phase: Problem definition and target users"),
    "02_Brainstorming":          ("Brainstorming Document",            "Ideation Phase: Technology choices and user journey"),
    "03_Empathy_Map":            ("Empathy Map",                       "Ideation Phase: User persona and pain/gain analysis"),
    "04_Requirement_Analysis":   ("Requirement Analysis",              "Functional, non-functional, API and database requirements"),
    "05_Frontend_Documentation": ("Frontend Development",              "HTML architecture, CSS design system and JavaScript logic"),
    "06_Backend_Documentation":  ("Backend Development",               "FastAPI routes, Pydantic models and database schema"),
    "07_AI_ML_Integration":      ("AI / ML Integration",               "Prompt engineering, Gemini AI integration and parsing"),
    "08_Testing_Documentation":  ("System Testing",                    "Unit, integration, performance and edge case testing"),
    "09_Deployment_Guide":       ("Deployment Guide",                  "Local setup, Docker, cloud deployment and CI/CD pipeline"),
    "10_Project_Report":         ("Project Report",                    "Executive summary, architecture, milestones, results and conclusion"),
}

CSS = """
@page {
    size: A4;
    margin: 18mm 16mm 18mm 16mm;
}
body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10.5pt;
    line-height: 1.65;
    color: #1a1a2e;
}
.header-box {
    background-color: #5248CC;
    color: #ffffff;
    padding: 16px 20px;
    margin-bottom: 24px;
}
.header-label {
    font-size: 8.5pt;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-bottom: 4px;
    color: #d4d0ff;
}
.header-title {
    font-size: 19pt;
    font-weight: bold;
    color: #ffffff;
    margin: 0 0 4px 0;
}
.header-sub {
    font-size: 9.5pt;
    color: #c8c4ff;
}
h1 {
    font-size: 18pt;
    font-weight: bold;
    color: #3d33b0;
    border-bottom: 2px solid #6C63FF;
    padding-bottom: 5px;
    margin-top: 26px;
    margin-bottom: 12px;
}
h2 {
    font-size: 14pt;
    font-weight: bold;
    color: #4a41c0;
    background-color: #f3f2ff;
    padding: 6px 10px;
    border-left: 4px solid #6C63FF;
    margin-top: 22px;
    margin-bottom: 10px;
}
h3 {
    font-size: 12pt;
    font-weight: bold;
    color: #3d3491;
    border-left: 3px solid #9b8af4;
    padding-left: 8px;
    margin-top: 18px;
    margin-bottom: 8px;
}
h4 {
    font-size: 10.5pt;
    font-weight: bold;
    color: #4a41c0;
    margin-top: 14px;
    margin-bottom: 6px;
}
p {
    margin-bottom: 9px;
}
pre {
    background-color: #1e1e3a;
    color: #dcdcf0;
    padding: 10px 13px;
    font-size: 8pt;
    font-family: "Courier New", Courier, monospace;
    white-space: pre-wrap;
    word-wrap: break-word;
    margin: 10px 0;
    border-left: 3px solid #6C63FF;
}
code {
    background-color: #ededff;
    color: #3d33b0;
    padding: 1px 4px;
    font-family: "Courier New", Courier, monospace;
    font-size: 9pt;
}
pre code {
    background-color: transparent;
    color: #dcdcf0;
    padding: 0;
    font-size: 8pt;
}
table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 9pt;
}
th {
    background-color: #5248CC;
    color: #ffffff;
    padding: 7px 9px;
    text-align: left;
    font-weight: bold;
    font-size: 8.5pt;
}
td {
    padding: 6px 9px;
    border: 1px solid #d8d5f5;
    color: #1a1a2e;
    vertical-align: top;
}
tr.even td {
    background-color: #f7f6ff;
}
ul, ol {
    margin: 8px 0 10px 0;
    padding-left: 20px;
}
li {
    margin-bottom: 4px;
    line-height: 1.55;
}
blockquote {
    border-left: 4px solid #6C63FF;
    background-color: #f3f2ff;
    margin: 12px 0;
    padding: 9px 13px;
    color: #3d3491;
    font-style: italic;
}
hr {
    border: none;
    border-top: 1px solid #d0ceee;
    margin: 18px 0;
}
strong { color: #3d33b0; font-weight: bold; }
em { color: #5248CC; }
.footer-note {
    margin-top: 32px;
    padding-top: 10px;
    border-top: 1px solid #d0ceee;
    font-size: 8.5pt;
    color: #999;
    text-align: center;
}
"""


def md_to_html_content(md_text):
    """Convert markdown to HTML with table support and alternating row colors."""
    html = markdown.markdown(
        md_text,
        extensions=[
            'markdown.extensions.tables',
            'markdown.extensions.fenced_code',
            'markdown.extensions.nl2br',
            'markdown.extensions.sane_lists',
        ]
    )
    # Add alternating row class for even rows
    lines = html.split('\n')
    in_table = False
    row_count = 0
    result = []
    for line in lines:
        if '<table>' in line:
            in_table = True
            row_count = 0
        if '</table>' in line:
            in_table = False
        if in_table and '<tr>' in line:
            row_count += 1
            if row_count % 2 == 0:
                line = line.replace('<tr>', '<tr class="even">')
        result.append(line)
    return '\n'.join(result)


def build_html(content, doc_title, doc_subtitle, filename):
    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
{CSS}
</style>
</head>
<body>
<div class="header-box">
  <div class="header-label">FitBuddy - AI-Powered Personal Fitness Coach</div>
  <div class="header-title">{doc_title}</div>
  <div class="header-sub">{doc_subtitle}</div>
</div>
{content}
<div class="footer-note">
  FitBuddy &copy; 2025 &nbsp;|&nbsp; Powered by Google Gemini AI &amp; FastAPI &nbsp;|&nbsp; {filename}
</div>
</body>
</html>"""


def convert_md_to_pdf(md_path, pdf_path, doc_key, filename):
    print(f"  Converting: {os.path.basename(md_path):40s}", end="", flush=True)

    with open(md_path, 'r', encoding='utf-8') as f:
        md_text = f.read()

    content_html = md_to_html_content(md_text)
    doc_title, doc_subtitle = SUBTITLES.get(doc_key, (filename, "FitBuddy Project Documentation"))
    full_html = build_html(content_html, doc_title, doc_subtitle, filename + ".md")

    with open(pdf_path, 'wb') as pdf_file:
        result = pisa.CreatePDF(
            src=full_html.encode('utf-8'),
            dest=pdf_file,
            encoding='utf-8'
        )

    if result.err:
        print(f"FAILED (errors: {result.err})")
        return False
    else:
        size_kb = os.path.getsize(pdf_path) // 1024
        print(f"OK  [{size_kb} KB]  ->  {os.path.basename(pdf_path)}")
        return True


def main():
    print("\n" + "=" * 68)
    print("  FitBuddy - Markdown to PDF Converter")
    print("=" * 68)
    print(f"  Output: {PDF_OUTPUT_DIR}\n")

    success = 0
    failed = 0

    for folder, md_filename, pdf_key in MARKDOWN_FILES:
        md_path = os.path.join(BASE_DIR, folder, md_filename) if folder else os.path.join(BASE_DIR, md_filename)

        if not os.path.exists(md_path):
            print(f"  SKIPPED (not found): {md_path}")
            continue

        pdf_path = os.path.join(PDF_OUTPUT_DIR, pdf_key + ".pdf")
        fn_label = pdf_key.split("_", 1)[-1] if "_" in pdf_key else pdf_key

        if convert_md_to_pdf(md_path, pdf_path, pdf_key, fn_label):
            success += 1
        else:
            failed += 1

    print("\n" + "-" * 68)
    print(f"  Done! {success} PDF(s) created successfully, {failed} failed.")
    print(f"  Open PDFs folder: {PDF_OUTPUT_DIR}")
    print("-" * 68 + "\n")


if __name__ == "__main__":
    main()
