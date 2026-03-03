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
      id: "left-tools",
      title: "Ruling Construction",
      content: "Use this sidebar to add lines, circles, and prickings quickly.",
      target: ".ruling-page .side-left",
      placement: "right",
    },
    {
      id: "canvas",
      title: "Main Canvas",
      content: "Draw directly with rulers and guides; zoom and snapping controls sit above this area.",
      target: ".ruling-page .center",
      placement: "top",
      spotlightPadding: 6,
    },
    {
      id: "right-panel",
      title: "Selection and Export",
      content: "Inspect selected elements, tune image alignment, and export from this side panel.",
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
