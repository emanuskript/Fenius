export const FLOW_TOUR_STEPS = {
  ruling: [
    {
      id: "welcome",
      title: "Welcome to Ruling",
      content:
        "This flow helps you build a full ruling schema with drawing, selection and export tools.",
      target: null,
      placement: "center",
    },
    {
      id: "meta",
      title: "Metadata Summary",
      content: "These manuscript details stay visible while you work and are included in exports.",
      target: ".ruling-page .meta-summary",
      placement: "bottom",
    },
    {
      id: "modes",
      title: "Interaction Modes",
      content:
        "Switch between Draw, Erase, and Select here. Draw adds new features, Erase removes them with the rectangular eraser, and Select lets you inspect, recolor, and adjust existing items.",
      target: ".ruling-page .side-left .panel:nth-of-type(1)",
      placement: "right",
    },
    {
      id: "lines",
      title: "Lines",
      content:
        "Build single horizontal lines or whole horizontal series here. This is the main control area for ruling lines before you refine them in Select mode.",
      target: ".ruling-page .side-left .panel:nth-of-type(2)",
      placement: "right",
    },
    {
      id: "prickings",
      title: "Prickings",
      content:
        "Add individual prickings or vertical groups from this section. In Draw mode you can also click directly inside the page to place them.",
      target: ".ruling-page .side-left .panel:nth-of-type(3)",
      placement: "right",
    },
    {
      id: "circles",
      title: "Circles and Ovals",
      content:
        "Use this section for compass impressions and irregular oval marks. After placing one, switch to Select mode to move the center and reshape its axes.",
      target: ".ruling-page .side-left .panel:nth-of-type(4)",
      placement: "right",
    },
    {
      id: "canvas-controls",
      title: "Canvas Controls",
      content:
        "These controls manage zoom, image visibility, opacity, and intersection labels so you can compare the ruling against the source image while you work.",
      target: ".ruling-page .stage-header",
      placement: "bottom",
    },
    {
      id: "canvas",
      title: "Main Canvas",
      content:
        "Use the rulers and page area to draw directly. The guides, millimetre snapping, and hover position readout all update here as you work.",
      target: ".ruling-page .canvas-wrap",
      placement: "top",
      spotlightPadding: 8,
    },
    {
      id: "right-panel",
      title: "Selection and Export",
      content:
        "The right sidebar is where you edit selected features, align the image, keep notes, and export the finished ruling schema.",
      target: ".ruling-page .side-right",
      placement: "left",
    },
  ],
  bookBinding: [
    {
      id: "welcome",
      title: "Welcome to Book Spine",
      content:
        "This flow visualizes sewing supports, holes, knots and ruptures across all quires.",
      target: null,
      placement: "center",
    },
    {
      id: "pens",
      title: "Drawing Controls",
      content: "Manage pens and eraser from this top control group.",
      target: ".bookbinding-screen .breadcrumb-main-controls",
      placement: "bottom",
    },
    {
      id: "recolor",
      title: "Recolor Lines and Dots",
      content:
        "Right-click lines, change-over stations, sewing holes, supports, headbands, and tailbands to open the context menu and recolor them.",
      target: ".bookbinding-screen .table-container",
      placement: "top",
      spotlightPadding: 6,
    },
    {
      id: "table",
      title: "Interactive Table",
      content: "This is your main workspace for supports, holes and structural annotations.",
      target: ".bookbinding-screen .table-container",
      placement: "top",
      spotlightPadding: 6,
    },
    {
      id: "legend-tools",
      title: "Functional Tools",
      content: "Use the footer tools to add supports, stations, knots, and edit rows.",
      target: ".bookbinding-screen .legend",
      placement: "top",
    },
    {
      id: "export",
      title: "Export",
      content: "Export your current structure to PDF once the setup is complete.",
      target: ".bookbinding-screen .continue-btn",
      placement: "top",
    },
  ],
};
