#!/usr/bin/env python3
"""Generate the static Skillosaic AI technical guide PDF used by GitHub Pages."""

from __future__ import annotations

import argparse
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

NAVY = colors.HexColor("#0B3D66")
BLUE = colors.HexColor("#2A6BA8")
LIGHT = colors.HexColor("#EEF3F8")
ORANGE = colors.HexColor("#D9822B")
TEXT = colors.HexColor("#263545")
MUTED = colors.HexColor("#5C6B7A")


def make_styles():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name="GuideTitle", parent=styles["Title"], fontName="Helvetica-Bold",
        fontSize=24, leading=29, textColor=NAVY, alignment=TA_CENTER, spaceAfter=8,
    ))
    styles.add(ParagraphStyle(
        name="GuideSubtitle", parent=styles["Normal"], fontName="Helvetica",
        fontSize=10.5, leading=15, textColor=MUTED, alignment=TA_CENTER, spaceAfter=14,
    ))
    styles.add(ParagraphStyle(
        name="H1x", parent=styles["Heading1"], fontName="Helvetica-Bold",
        fontSize=17, leading=20, textColor=NAVY, spaceBefore=7, spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        name="H2x", parent=styles["Heading2"], fontName="Helvetica-Bold",
        fontSize=11.5, leading=14, textColor=BLUE, spaceBefore=6, spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        name="Bodyx", parent=styles["BodyText"], fontName="Helvetica",
        fontSize=8.6, leading=12, textColor=TEXT, spaceAfter=5,
    ))
    styles.add(ParagraphStyle(
        name="Smallx", parent=styles["BodyText"], fontName="Helvetica",
        fontSize=7.6, leading=10, textColor=MUTED, spaceAfter=3,
    ))
    styles.add(ParagraphStyle(
        name="Eqx", parent=styles["BodyText"], fontName="Courier",
        fontSize=7.7, leading=10, textColor=NAVY, alignment=TA_CENTER,
        backColor=colors.HexColor("#F2F7FB"), borderColor=BLUE, borderWidth=0.6,
        borderPadding=5, spaceBefore=4, spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        name="Calloutx", parent=styles["BodyText"], fontName="Helvetica",
        fontSize=8.3, leading=11.5, textColor=NAVY,
        backColor=LIGHT, borderColor=BLUE, borderWidth=0.7,
        borderPadding=7, spaceBefore=4, spaceAfter=7,
    ))
    return styles


STYLES = make_styles()


def p(text, style="Bodyx"):
    return Paragraph(text, STYLES[style])


def bullets(items):
    return ListFlowable(
        [ListItem(p(item), leftIndent=12) for item in items],
        bulletType="bullet",
        start="circle",
        leftIndent=18,
        bulletFontSize=5,
        spaceAfter=5,
    )


def numbered(items):
    return ListFlowable(
        [ListItem(p(item), leftIndent=12) for item in items],
        bulletType="1",
        leftIndent=20,
        spaceAfter=5,
    )


def kv_table(rows, widths=(48 * mm, 118 * mm)):
    data = [[p("<b>Item</b>", "Smallx"), p("<b>Description</b>", "Smallx")]]
    for left, right in rows:
        data.append([p(f"<b>{left}</b>", "Smallx"), p(right, "Smallx")])
    table = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#D9E1E8")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return table


def flow_row(items):
    data = []
    for index, item in enumerate(items):
        data.append(p(f"<b>{item}</b>", "Smallx"))
        if index < len(items) - 1:
            data.append(p("<b>&gt;</b>", "Smallx"))

    arrow_width = 4.5 * mm
    available_width = 166 * mm
    item_width = (available_width - arrow_width * (len(items) - 1)) / len(items)
    widths = [item_width if i % 2 == 0 else arrow_width for i in range(len(data))]
    table = Table([data], colWidths=widths, hAlign="CENTER")
    style = [
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ]
    for i in range(0, len(data), 2):
        style.extend([
            ("BOX", (i, 0), (i, 0), 0.65, BLUE),
            ("BACKGROUND", (i, 0), (i, 0), colors.white),
            ("TOPPADDING", (i, 0), (i, 0), 7),
            ("BOTTOMPADDING", (i, 0), (i, 0), 7),
        ])
    for i in range(1, len(data), 2):
        style.append(("TEXTCOLOR", (i, 0), (i, 0), ORANGE))
    table.setStyle(TableStyle(style))
    return table


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#DDE4EA"))
    canvas.setLineWidth(0.4)
    canvas.line(18 * mm, 12 * mm, 192 * mm, 12 * mm)
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 6.5)
    canvas.drawCentredString(
        105 * mm,
        7.5 * mm,
        f"Skillosaic - How Artificial Intelligence Is Used | Page {doc.page}",
    )
    canvas.restoreState()


def build_story():
    story = [
        Spacer(1, 16 * mm),
        p("<font color='#D9822B'><b>SKILLOSAIC</b></font>", "GuideSubtitle"),
        Spacer(1, 12 * mm),
        p("How Artificial Intelligence Is Used", "GuideTitle"),
        p(
            "Detailed technical guide to K-Means color extraction, camera color correction, "
            "and Red / Yellow / Blue paint formulation",
            "GuideSubtitle",
        ),
        Spacer(1, 8 * mm),
        flow_row([
            "Camera / Image",
            "K-Means",
            "Camera Correction",
            "Paint Model",
            "Delta E00 Search",
            "R/Y/B Recipe",
        ]),
        Spacer(1, 11 * mm),
        p("<b>AI Engineering - Skills Challenge 2026</b>", "GuideSubtitle"),
        p("Emirates Skills | Browser-based color analysis and formulation", "GuideSubtitle"),
        PageBreak(),

        p("1. What AI means in Skillosaic", "H1x"),
        p(
            "Skillosaic uses several forms of machine learning and numerical intelligence rather "
            "than one large neural network. The system combines unsupervised clustering, supervised "
            "regression, color science and constrained optimization. Each technique solves a "
            "different part of the physical problem: extracting representative colors from an "
            "image, correcting the webcam measurement so that it behaves more like a calibrated "
            "Nix reference, and estimating a paint recipe that can reproduce the desired LAB color."
        ),
        p(
            "The important idea is a chain of models. A camera pixel is not treated as a paint "
            "recipe directly. The image is simplified first, the camera color is corrected second, "
            "and only then is the target color sent to the paint model.",
            "Calloutx",
        ),
        p("1.1 End-to-end pipeline", "H2x"),
        flow_row([
            "RGB image",
            "CIELAB",
            "K-Means",
            "Nix-equivalent LAB",
            "Forward paint RBF",
            "Delta E00 optimization",
        ]),
        Spacer(1, 3 * mm),
        kv_table([
            ("Image acquisition", "Camera frame or uploaded image provides RGB pixel values."),
            ("Color representation", "RGB is converted to CIELAB so color distances are handled in a perceptual color space."),
            ("K-Means", "Pixels are grouped into representative color clusters."),
            ("Camera correction", "Camera LAB is transformed toward Nix-equivalent LAB using a learned RBF correction model."),
            ("Paint prediction", "A second RBF predicts the LAB produced by candidate R/Y/B recipes."),
            ("Inverse search", "CIEDE2000 Delta E00 is minimized to choose the recipe closest to the target."),
        ]),
        Spacer(1, 3 * mm),
        p("1.2 Why CIELAB is central", "H2x"),
        p(
            "CIELAB separates lightness from opponent color axes. L* represents lightness, a* runs "
            "approximately from green to red, and b* runs approximately from blue to yellow. "
            "Skillosaic uses LAB because both clustering and paint matching become easier to "
            "interpret than they would be in raw RGB."
        ),
        p("RGB -> XYZ (D65) -> CIELAB [L*, a*, b*]", "Eqx"),

        p("2. K-Means: extracting representative colors", "H1x"),
        p(
            "K-Means is the unsupervised-learning component of Skillosaic. It discovers groups in "
            "the image without requiring labels such as red, green or blue. Each pixel is represented "
            "by numerical color coordinates and assigned to the nearest cluster centroid."
        ),
        p("2.1 K-Means++ initialization", "H2x"),
        p(
            "K-Means++ selects initial centroids so that new centers are more likely to be far from "
            "centroids already chosen. This reduces poor initial configurations."
        ),
        p("Assign pixel i to cluster c = arg min ||x_i - centroid_c||^2", "Eqx"),
        p("2.2 Mosaic &amp; Contours implementation", "H2x"),
        bullets([
            "The image is converted from sRGB to CIELAB.",
            "Pixels below the Black L* threshold are assigned to a dedicated black group.",
            "Pixels above the White L* threshold are assigned to a dedicated white group.",
            "The remaining pixels are clustered with K-Means++ using only a* and b*.",
            "The current Mosaic & Contours workflow uses K = 5 color clusters, plus black and white.",
            "Using only a* and b* makes grouping intentionally less sensitive to lightness variation.",
        ]),
        p(
            "This version is useful for mosaic segmentation because pixels with similar chromatic "
            "character can remain in the same group even when one is brighter than the other.",
            "Calloutx",
        ),
        p("2.3 Paint Formulation implementation", "H2x"),
        bullets([
            "The user can select K from 3 to 10.",
            "Clustering uses the full L*, a*, b* coordinates.",
            "At most about 18,000 pixels are sampled for centroid training.",
            "After centroid training, every image pixel is assigned to its nearest LAB centroid.",
            "Clusters are sorted by image coverage and become the representative-color cards.",
            "Each representative card stores RGB, Camera LAB, Nix-equivalent LAB, coverage and formulation.",
        ]),
        p("Image pixels -> K clusters -> representative colors -> one formulation per cluster", "Eqx"),
        p("2.4 What K-Means does not do", "H2x"),
        p(
            "K-Means does not understand semantic objects. It does not know whether a region is a "
            "wall, fruit, fabric or paint. It only groups colors numerically."
        ),

        p("3. Camera correction model", "H1x"),
        p(
            "A normal webcam is not a calibrated color-measurement instrument. Sensor response, "
            "lighting, exposure, white balance, lens characteristics and browser processing can "
            "shift the RGB and LAB values. Skillosaic uses supervised calibration to move Camera "
            "LAB measurements toward Nix measurements."
        ),
        p("3.1 Training data and target", "H2x"),
        p(
            "The current browser model contains 24 paired observations. For each physical paint "
            "sample there is a Camera LAB measurement and the corresponding Nix LAB reference. "
            "The model learns the correction vector rather than Nix LAB directly."
        ),
        p("Delta LAB = Nix LAB - Camera LAB", "Eqx"),
        p("Nix-equivalent LAB = Camera LAB + predicted Delta LAB", "Eqx"),
        p("3.2 Standardization", "H2x"),
        p(
            "Each Camera LAB coordinate is standardized using the calibration-set mean and standard "
            "deviation before the RBF is trained or queried."
        ),
        p("x_standardized = (x - mean) / standard deviation", "Eqx"),
        p("3.3 Cubic Radial Basis Function regression", "H2x"),
        p(
            "The correction model is a cubic Radial Basis Function (RBF) regressor. The input is "
            "standardized Camera LAB and the outputs are Delta L*, Delta a* and Delta b*. The radial "
            "basis is phi(r) = r^3 and a linear polynomial term is included. The current camera model "
            "uses smoothing = 5.0."
        ),
        p("phi(r) = r^3", "Eqx"),
        p("3.4 Why fixed camera conditions matter", "H2x"),
        bullets([
            "The learned correction is specific to the physical setup used for calibration.",
            "Changing exposure, white balance, illumination spectrum or camera can change systematic error.",
            "For best consistency, preserve camera, distance, lighting and manual settings.",
            "Brightness and contrast post-processing should remain consistent with calibration.",
        ]),
        p(
            "The model corrects systematic measurement bias; it cannot make uncontrolled lighting "
            "irrelevant. Good physical measurement conditions remain part of the AI system.",
            "Calloutx",
        ),
        p("3.5 Manual LAB bypass", "H2x"),
        p(
            "LAB entered manually from Nix or another calibrated source is already treated as the "
            "target LAB and bypasses the camera-correction model."
        ),

        p("4. Paint formulation model", "H1x"),
        p(
            "The second learned model describes the relationship between Red / Yellow / Blue paint "
            "recipes and the LAB color produced after mixing. It is a forward model: given a recipe, "
            "it predicts the resulting LAB."
        ),
        p("4.1 Physical training samples", "H2x"),
        kv_table([
            ("Model input", "Paint percentages R%, Y%, B%, constrained so R + Y + B = 100."),
            ("Model target", "Nix-measured CIELAB [L*, a*, b*]."),
            ("Training samples", "24 physical R/Y/B recipes."),
            ("Regression method", "Cubic RBF with smoothing = 0.001."),
            ("Purpose", "Predict LAB for recipes that were not measured directly."),
        ]),
        Spacer(1, 3 * mm),
        p("4.2 Why only two recipe coordinates are needed", "H2x"),
        p(
            "Because the percentages must add to 100%, only two values are independent. Skillosaic "
            "uses Red and Yellow as model coordinates and calculates Blue from the constraint."
        ),
        p("B = 100 - R - Y", "Eqx"),
        p("Forward model: [R/100, Y/100] -> predicted [L*, a*, b*]", "Eqx"),
        p("4.3 Forward prediction", "H2x"),
        p(
            "A cubic RBF is trained on the 24 measured recipe points. For any valid candidate recipe, "
            "the model predicts the corresponding LAB. The current paint model uses smoothing = 0.001."
        ),

        p("5. From target LAB to a paint recipe", "H1x"),
        p(
            "The user needs the inverse problem: given a target LAB, find R%, Y% and B%. Skillosaic "
            "solves this using the learned forward model plus constrained search rather than a direct "
            "inverse regressor."
        ),
        p("5.1 Why a forward model is useful", "H2x"),
        p(
            "Different recipes can produce very similar LAB values, so the inverse mapping can be "
            "ambiguous. A forward model evaluates candidates in the same direction as the training "
            "data: recipe -> predicted LAB."
        ),
        p("5.2 CIEDE2000 color distance", "H2x"),
        p(
            "CIEDE2000 Delta E00 compares the target with the predicted LAB of each candidate. "
            "It is a perceptual color-difference metric and is more appropriate for color matching "
            "than simple Euclidean distance in raw RGB."
        ),
        p("Objective = minimize Delta E00(Target LAB, Predicted LAB(recipe))", "Eqx"),
        p("5.3 Search strategy implemented in the browser", "H2x"),
        numbered([
            "Compare the target with the 24 measured Nix formulations. If the nearest measured sample is within Delta E00 <= 1.0, reuse it directly.",
            "Otherwise evaluate the full R/Y/B simplex in 1 percentage-point increments.",
            "Keep the best 1% candidate as the center of a local search.",
            "Refine around that candidate within about +/-2 percentage points using 0.25 percentage-point increments.",
            "Return the recipe with the lowest predicted Delta E00.",
            "Convert percentages to grams using the requested total paint mass.",
        ]),
        p("grams(component) = total grams x component percentage / 100", "Eqx"),
        p("5.4 Predicted versus measured Delta E00", "H2x"),
        p(
            "The formulation Delta E00 is model-based. Final Verification is different: the paint "
            "is physically mixed, measured, and compared with the desired LAB. Physical measurement "
            "is the final validation."
        ),

        p("6. How the AI components work together", "H1x"),
        kv_table([
            ("K-Means++", "Unsupervised learning. Reduces an image to representative colors."),
            ("Camera correction RBF", "Supervised regression. Learns Camera LAB to Nix LAB correction."),
            ("Paint formulation RBF", "Supervised regression. Learns R/Y/B recipe to Nix LAB."),
            ("Delta E00 search", "Constrained optimization. Finds the closest valid predicted recipe."),
        ]),
        Spacer(1, 3 * mm),
        p("6.1 Learned versus deterministic steps", "H2x"),
        kv_table([
            ("RGB -> LAB", "Deterministic color-space conversion."),
            ("K-Means centroids", "Learned from each current image without labels."),
            ("Camera correction", "Learned from paired Camera/Nix measurements."),
            ("Paint forward model", "Learned from measured recipes and Nix LAB."),
            ("Delta E00", "Deterministic color-difference formula."),
            ("Recipe search", "Deterministic constrained search using the learned forward model."),
        ]),

        p("7. Example reasoning for one representative color", "H1x"),
        numbered([
            "Capture a frame and convert RGB pixels to LAB.",
            "Use K-Means to obtain a representative cluster.",
            "Convert the representative color to Camera LAB.",
            "Use the camera RBF to predict Delta LAB and obtain Nix-equivalent LAB.",
            "Use the corrected LAB as the paint target.",
            "Use the paint RBF to predict LAB for candidate R/Y/B recipes.",
            "Use CIEDE2000 to compare each candidate with the target.",
            "Return the lowest-distance recipe as percentages and grams.",
            "Mix the physical paint and measure it.",
            "Enter the measured LAB during Verification to close the loop.",
        ]),
        p("7.1 Why this is an AI Engineering example", "H2x"),
        p(
            "The project demonstrates that AI engineering is more than choosing a neural network. "
            "It requires data collection, measurement discipline, feature representation, model "
            "selection, constraints, optimization, user-interface design and physical validation."
        ),

        p("8. Limitations and responsible interpretation", "H1x"),
        bullets([
            "The camera model is calibrated for a particular physical setup.",
            "The paint model is based on 24 measured R/Y/B recipes; extrapolation can be unreliable.",
            "Paint mixing can be affected by pigment batch, substrate, film thickness, drying and measurement conditions.",
            "K-Means can vary slightly because K-Means++ includes random initialization.",
            "The browser inverse is a discrete numerical search, not an analytic inverse.",
            "A low predicted Delta E00 does not prove a perfect physical match; the mixed sample must be measured.",
        ]),
        p(
            "Final authority: the physically mixed sample and the instrument measurement. "
            "The AI recommends and predicts; the verification measurement confirms.",
            "Calloutx",
        ),

        p("9. Current implementation reference", "H1x"),
        kv_table([
            ("Mosaic K", "5 color clusters plus separate black and white threshold groups."),
            ("Paint Formulation K", "Selectable from 3 to 10."),
            ("K-Means sample", "Approximately 18,000 pixels maximum for centroid training."),
            ("K-Means iterations", "35 iterations maximum."),
            ("Camera calibration pairs", "24 Camera LAB / Nix LAB pairs."),
            ("Camera correction", "Standardized cubic RBF, smoothing = 5.0."),
            ("Paint recipes", "24 measured R/Y/B recipes."),
            ("Paint forward model", "Cubic RBF using R and Y coordinates, smoothing = 0.001."),
            ("Measured recipe reuse", "Delta E00 <= 1.0."),
            ("Global search", "1 percentage point."),
            ("Local refinement", "0.25 percentage points around the best global candidate."),
            ("Paint components", "Red, Yellow and Blue; B = 100 - R - Y."),
        ]),
        Spacer(1, 3 * mm),

        p("10. Summary", "H1x"),
        p(
            "Skillosaic uses AI as a sequence of specialized, interpretable tools. K-Means discovers "
            "representative colors. A camera-correction RBF converts webcam-derived LAB toward the "
            "Nix measurement domain. A paint RBF models how R/Y/B mixtures produce LAB colors. "
            "CIEDE2000 optimization searches the valid recipe space, and physical Verification closes "
            "the loop between prediction and reality."
        ),
        flow_row(["Image", "Cluster", "Correct", "Predict", "Optimize", "Mix", "Measure"]),
    ]
    return story


def generate(output: Path):
    output.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(output),
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=17 * mm,
        title="Skillosaic - How Artificial Intelligence Is Used",
        author="Emirates Skills",
    )
    doc.build(build_story(), onFirstPage=footer, onLaterPages=footer)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output",
        default="static/docs/Skillosaic_AI_Detailed_Guide.pdf",
        help="Path to the PDF to generate.",
    )
    args = parser.parse_args()
    generate(Path(args.output))
