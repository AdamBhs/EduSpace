# EduSpace — PFA Report (LaTeX)

## Prerequisites

### TeX Distribution
Install `texlive-full` (recommended) or at minimum these packages:
```bash
sudo apt install texlive-xetex texlive-latex-extra texlive-bibtex-extra \
  texlive-fonts-extra texlive-pictures biber
```

### Font
The report uses **Liberation Sans** by default (available on most Linux systems).
To use **Calibri** instead (exact university spec), install the font and change `main.tex`:
```latex
\setmainfont{Calibri}
```

On Ubuntu, install Liberation Sans if missing:
```bash
sudo apt install fonts-liberation
```

## Compilation (Local)

Run these commands **from the `EduSpace-Report/` directory**:

```bash
# Step 1: First pass (XeLaTeX)
xelatex main.tex

# Step 2: Process bibliography
biber main

# Step 3: Second pass (resolve references)
xelatex main.tex

# Step 4: Third pass (finalize cross-references)
xelatex main.tex
```

Or as a one-liner:
```bash
xelatex main.tex && biber main && xelatex main.tex && xelatex main.tex
```

The output is `main.pdf`.

## Compilation on Overleaf

1. Create a new **Blank Project** on Overleaf.
2. Upload all files and folders from `EduSpace-Report/`.
3. Go to **Menu → Settings** and set:
   - **Compiler**: XeLaTeX
   - **Main document**: `main.tex`
4. Click **Recompile**.

> **Note:** If Overleaf does not have Liberation Sans, it will fall back to the default sans-serif font. You can change `\setmainfont{Liberation Sans}` to `\setmainfont{Arial}` in `main.tex` for Overleaf compatibility.

## Project Structure

```
EduSpace-Report/
├── main.tex              # Master document (preamble + includes)
├── pagePFA.tex           # Cover page (Page de Garde)
├── Abstract.tex          # Abstract (EN + FR) and keywords
├── Acronyms.tex          # List of abbreviations
├── Introduction.tex      # General Introduction
├── Conclusion.tex        # General Conclusion and Perspectives
├── references.bib        # Bibliography (BibLaTeX)
├── Chapters/
│   ├── Chapter1.tex      # General Project Presentation
│   ├── Chapter2.tex      # Requirements Analysis
│   ├── Chapter3.tex      # System Design
│   └── Chapter4.tex      # Implementation and Deployment
├── images/               # Figures, diagrams, screenshots
└── README.md             # This file
```
