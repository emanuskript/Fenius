export const BOOK_PATHS_FLOW = {
  start: {
    id: "start",
    kind: "style",
    style: null,
    title: "Choose a Style",
    body: "Choose the historical binding tradition. Romanesque is available now; Carolingian and Gothic are coming soon.",
    images: ["72"],
    options: [
      { label: "Carolingian", disabled: true },
      { label: "Romanesque", next: "romanesque_intro", set: { style: "Romanesque" } },
      { label: "Gothic", disabled: true },
    ],
  },

  carolingian_board: {
    id: "carolingian_board",
    kind: "step",
    style: "Carolingian",
    title: "Board Form",
    body: "Select the board edge profile used for this Carolingian reconstruction.",
    images: ["26", "27"],
    options: [
      { label: "Square board", next: "carolingian_channels", set: { board: "square" } },
      { label: "Bevelled board", next: "carolingian_channels", set: { board: "bevelled" } },
    ],
  },
  carolingian_channels: {
    id: "carolingian_channels",
    kind: "step",
    style: "Carolingian",
    title: "Board Channel Pattern",
    body: "Choose the board channel/attachment pattern.",
    images: ["33", "34"],
    options: [
      { label: "Pattern A", next: "carolingian_holes", set: { channels: "A" } },
      { label: "Pattern E", next: "carolingian_holes", set: { channels: "E" } },
    ],
  },
  carolingian_holes: {
    id: "carolingian_holes",
    kind: "step",
    style: "Carolingian",
    title: "Sewing Hole Preparation",
    body: "Select the hole preparation strategy for sewing stations.",
    images: ["8", "9", "10", "11"],
    options: [
      { label: "Pierced stations", next: "carolingian_changeover", set: { holes: "pierced" } },
      { label: "Cut stations", next: "carolingian_changeover", set: { holes: "cut" } },
    ],
  },
  carolingian_changeover: {
    id: "carolingian_changeover",
    kind: "step",
    style: "Carolingian",
    title: "Change-over Stations",
    body: "Define thread movement at head and tail stations.",
    images: ["21+22", "23+24"],
    options: [
      { label: "Link-stitch change-over", next: "carolingian_endleaf", set: { changeOver: "link" } },
      { label: "Span-stitch change-over", next: "carolingian_endleaf", set: { changeOver: "span" } },
    ],
  },
  carolingian_endleaf: {
    id: "carolingian_endleaf",
    kind: "step",
    style: "Carolingian",
    title: "Endleaf Construction",
    body: "Choose the endleaf strategy before lining and endbanding.",
    images: ["1+2", "3B", "2F"],
    options: [
      { label: "Integrated endleaf", next: "carolingian_lining", set: { endleaf: "integrated" } },
      { label: "Added endleaf", next: "carolingian_lining", set: { endleaf: "added" } },
    ],
  },
  carolingian_lining: {
    id: "carolingian_lining",
    kind: "step",
    style: "Carolingian",
    title: "Spine Lining",
    body: "Select a lining treatment for the spine.",
    images: ["39", "40"],
    options: [
      { label: "Patch lining", next: "carolingian_endband", set: { lining: "patch" } },
      { label: "Slotted lining", next: "carolingian_endband", set: { lining: "slotted" } },
    ],
  },
  carolingian_endband: {
    id: "carolingian_endband",
    kind: "step",
    style: "Carolingian",
    title: "Endband Program",
    body: "Choose how the endband is supported and finished.",
    images: ["47", "48", "52", "53"],
    options: [
      { label: "Unsupported endband", next: "carolingian_fastening", set: { endband: "unsupported" } },
      { label: "Supported endband", next: "carolingian_fastening", set: { endband: "supported" } },
    ],
  },
  carolingian_fastening: {
    id: "carolingian_fastening",
    kind: "step",
    style: "Carolingian",
    title: "Fastening Choice",
    body: "Finalize the Carolingian route with fastening details.",
    images: ["63", "69"],
    options: [
      { label: "Use Carolingian fastening", next: "carolingian_end", set: { fastening: "carolingian" } },
      { label: "No fastening", next: "carolingian_end", set: { fastening: "none" } },
    ],
  },
  carolingian_end: {
    id: "carolingian_end",
    kind: "end",
    style: "Carolingian",
    title: "Carolingian Path Complete",
    body: "This Carolingian branch is complete.",
    images: ["59"],
    options: [],
  },

  // ---------------------------------------------------------------------------
  // Romanesque branch — faithful to "Bookbinding Romanesque" decision diagram.
  // 14 user steps + intro. Two genuine option-branches (sewing stitch depends on
  // the support material; perimeter sewing depends on the endband-tab shape) and
  // one derived-image step (back-cornering shows the board profile chosen earlier).
  // ---------------------------------------------------------------------------
  romanesque_intro: {
    id: "romanesque_intro",
    kind: "step",
    style: "Romanesque",
    title: "Romanesque Binding",
    body: "You'll reconstruct a Romanesque binding step by step, starting from the bare book block. Each choice is recorded and can be revised with Back or from the breadcrumb path.",
    images: ["72"],
    options: [
      { label: "Begin", next: "romanesque_holes" },
    ],
  },

  romanesque_holes: {
    id: "romanesque_holes",
    kind: "step",
    style: "Romanesque",
    title: "Sewing Supports & Holes",
    body: "Your quires are stacked on top of one another. This book block is designed for three equally-spaced sewing supports — the most common Romanesque design. Because the supports are sewn to the block, the quires need holes for the thread. Were the holes cut (with a knife or chisel) or pierced (with an awl or needle)? This was probably done while the quires were held tight in a press.",
    images: ["9", "8"],
    options: [
      { label: "Cut (knife or chisel)", next: "romanesque_endleaves", set: { holes: "cut" } },
      { label: "Pierced (awl or needle)", next: "romanesque_endleaves", set: { holes: "pierced" } },
    ],
  },

  romanesque_endleaves: {
    id: "romanesque_endleaves",
    kind: "step",
    style: "Romanesque",
    title: "Endleaves",
    body: "Decide whether to add endleaves — additional wraps for the book block, sometimes glued down to the inside cover (almost always after the boards were covered). The form could vary, especially of an added quire (sometimes a folio with a stub), and front and back endleaves could be treated differently.",
    images: ["2B", "3B"],
    options: [
      { label: "Use no endleaves", next: "romanesque_support", set: { endleaves: "none" } },
      { label: "Use the first & last pages of the block", next: "romanesque_support", set: { endleaves: "first-last-pages" } },
      { label: "Add a thin additional quire", next: "romanesque_support", set: { endleaves: "added-quire" } },
      { label: "Wrap in a large bifolium", next: "romanesque_support", set: { endleaves: "wrapped-bifolium" } },
    ],
  },

  romanesque_support: {
    id: "romanesque_support",
    kind: "step",
    style: "Romanesque",
    title: "Sewing-Support Material",
    body: "The quires are sewn along three sewing supports that will later be laced into the boards. These supports are alum-tawed leather, about 8–20 mm wide. Choose the support form.",
    images: ["12A", "14A"],
    options: [
      { label: "A strap slit down the middle", next: "romanesque_stitch_slit", set: { support: "slit-leather" } },
      { label: "A twisted strap", next: "romanesque_stitch_twisted", set: { support: "twisted-leather" } },
    ],
  },

  romanesque_stitch_slit: {
    id: "romanesque_stitch_slit",
    kind: "step",
    style: "Romanesque",
    title: "Sewing Stitch",
    body: "The supports are suspended on the crossbar of the sewing frame. The needle draws thread through each quire and wraps around the support; at the change-over station at either end of the spine the thread reverses direction — in the Romanesque period generally with a link stitch. With a slit leather support, which main stitch will you use?",
    images: ["82", "81"],
    options: [
      { label: "Herringbone", next: "romanesque_board", set: { sewing: "herringbone" } },
      { label: "Straight", next: "romanesque_board", set: { sewing: "straight" } },
    ],
  },

  romanesque_stitch_twisted: {
    id: "romanesque_stitch_twisted",
    kind: "step",
    style: "Romanesque",
    title: "Sewing Stitch",
    body: "The supports are suspended on the crossbar of the sewing frame. The needle draws thread through each quire and wraps around the support; at the change-over station the thread reverses direction, generally with a link stitch. With a twisted leather support, the stitch is:",
    images: ["83"],
    options: [
      { label: "Packed straight", next: "romanesque_board", set: { sewing: "packed-straight" } },
    ],
  },

  romanesque_board: {
    id: "romanesque_board",
    kind: "step",
    style: "Romanesque",
    title: "Book-Board Edge",
    body: "The book block is laid aside and the boards are prepared. Oak was common, and Romanesque boards were typically a little thicker at the spine. Choose the edge profile of the board.",
    images: ["26", "27", "28"],
    options: [
      { label: "Squared", next: "romanesque_channels", set: { board: "square" } },
      { label: "Slightly beveled", next: "romanesque_channels", set: { board: "bevelled" } },
      { label: "Rounded", next: "romanesque_channels", set: { board: "rounded" } },
    ],
  },

  romanesque_channels: {
    id: "romanesque_channels",
    kind: "step",
    style: "Romanesque",
    title: "Lacing Channels",
    body: "Channels are drilled into the boards so the sewing supports can be laced through the spine edge and held with a wedge, peg or nail. Both patterns enter the board on the side: in Type I the lacing channel is relatively short; in Type II, relatively long. (The endband support cable could also be laced in.)",
    images: ["35R"],
    options: [
      { label: "Type I (short channel)", next: "romanesque_backcorner", set: { channels: "type-1" } },
      { label: "Type II (long channel)", next: "romanesque_backcorner", set: { channels: "type-2" } },
    ],
  },

  romanesque_backcorner: {
    id: "romanesque_backcorner",
    kind: "step",
    style: "Romanesque",
    title: "Back-Cornering",
    body: "The corners of the spine head and tail are now cut, or \"back-cornered,\" at a slant to accommodate the endbands that will be added later. The illustration reflects the board profile you chose.",
    imagesFromDerived: {
      key: "board",
      map: { square: ["29"], bevelled: ["30"], rounded: ["31B"] },
      fallback: ["29", "30", "31B"],
    },
    options: [
      { label: "Back-corner the spine", next: "romanesque_lacing", set: { backCornered: true } },
    ],
  },

  romanesque_lacing: {
    id: "romanesque_lacing",
    kind: "step",
    style: "Romanesque",
    title: "Lace Supports into the Boards",
    body: "The sewing supports are laced into the drilled channels and pegged in place. As in earlier Carolingian binding, the rough edges of the book block and the wooden boards are trimmed at the same time (perhaps with a drawknife).",
    images: ["90"],
    options: [
      { label: "Continue", next: "romanesque_lining" },
    ],
  },

  romanesque_lining: {
    id: "romanesque_lining",
    kind: "step",
    style: "Romanesque",
    title: "Spine Lining",
    body: "As reinforcement, a lining of chamois leather, textile or parchment could be pasted along the spine (wooden pegs could also fasten it to the board). In reality several linings could be combined, even layered on top of one another.",
    images: ["39B", "40B"],
    options: [
      { label: "No lining", next: "romanesque_endbands", set: { lining: "none" } },
      { label: "Patch lining", next: "romanesque_endbands", set: { lining: "patch" } },
      { label: "Full-length slotted lining", next: "romanesque_endbands", set: { lining: "slotted" } },
    ],
  },

  romanesque_endbands: {
    id: "romanesque_endbands",
    kind: "step",
    style: "Romanesque",
    title: "Endbands",
    body: "The spine edges are reinforced with endbands, which link the quires together at the head and tail. A tab lines each end, often supported along the spine corner by one or two cables of the same material as the sewing support (e.g. alum-tawed leather). Before the fourteenth century the stitching was rarely embroidered with coloured linen or silk.",
    images: ["49", "48", "50"],
    options: [
      { label: "Double support, straight packed", next: "romanesque_tab", set: { endband: "double-straight-packed" } },
      { label: "Double support, herringbone", next: "romanesque_tab", set: { endband: "double-herringbone" } },
      { label: "Single support, straight packed", next: "romanesque_tab", set: { endband: "single-straight-packed" } },
    ],
  },

  romanesque_tab: {
    id: "romanesque_tab",
    kind: "step",
    style: "Romanesque",
    title: "Endband-Tab Trim",
    body: "The top of the endband tab is trimmed — mostly round, but sometimes squared. Which will you choose?",
    images: ["52", "53"],
    options: [
      { label: "Square tab", next: "romanesque_cover_square", set: { endbandTab: "square" } },
      { label: "Round tab", next: "romanesque_cover_round", set: { endbandTab: "round" } },
    ],
  },

  romanesque_cover_square: {
    id: "romanesque_cover_square",
    kind: "step",
    style: "Romanesque",
    title: "Covering & Perimeter Sewing",
    body: "The boards are covered — most often in pale chamois or alum-tawed leather, or red/brown vegetable-tanned leather (preferred if the book was to be blind-tooled), pasted with starch. On the inside boards the covering is cut at the corners (\"mitred\") and the edges sewn together, along with the endband tab. With your square tab, choose the perimeter stitch.",
    images: ["55A", "56B", "58"],
    options: [
      { label: "Link stitch", next: "romanesque_fastening", set: { coverStitch: "link" } },
      { label: "Saddle stitch", next: "romanesque_fastening", set: { coverStitch: "saddle" } },
    ],
  },

  romanesque_cover_round: {
    id: "romanesque_cover_round",
    kind: "step",
    style: "Romanesque",
    title: "Covering & Perimeter Sewing",
    body: "The boards are covered — most often in pale chamois or alum-tawed leather, or red/brown vegetable-tanned leather (preferred if the book was to be blind-tooled), pasted with starch. On the inside boards the covering is cut at the corners (\"mitred\") and the edges sewn together, along with the endband tab. With your round tab, choose the perimeter stitch.",
    images: ["55", "56", "58"],
    options: [
      { label: "Link stitch", next: "romanesque_fastening", set: { coverStitch: "link" } },
      { label: "Saddle stitch", next: "romanesque_fastening", set: { coverStitch: "saddle" } },
    ],
  },

  romanesque_fastening: {
    id: "romanesque_fastening",
    kind: "step",
    style: "Romanesque",
    title: "Fastening",
    body: "Finally, a fastening could be fashioned — usually a leather strap of two pieces, nailed near the free edge of one cover (generally the upper) with a bronze or iron eyelet or hasp that fits over a peg on the opposite cover. A short strap joins a peg on the opposite board's edge (inherited from the Carolingian period, favoured in Germany and Central Europe); a long strap wraps around to a peg on the side of the opposite cover (dominant after 1200 and in French and English bindings).",
    images: ["63", "64"],
    options: [
      { label: "Short strap", next: "romanesque_end", set: { fastening: "short-strap" } },
      { label: "Long strap", next: "romanesque_end", set: { fastening: "long-strap" } },
    ],
  },

  romanesque_end: {
    id: "romanesque_end",
    kind: "end",
    style: "Romanesque",
    title: "Your Romanesque Binding",
    body: "Here is your cover. Sometimes a fixed or loose overcover was added to wrap the book, and the cover could be painted, embellished or decorated in various ways. Your Romanesque path is complete — review the summary, revise with Back, or restart.",
    images: ["59"],
    options: [],
  },

  gothic_board: {
    id: "gothic_board",
    kind: "step",
    style: "Gothic",
    title: "Board Profile",
    body: "Choose a Gothic board profile and overall geometry.",
    images: ["37", "38", "26"],
    options: [
      { label: "Type B board", next: "gothic_support", set: { boardType: "B" } },
      { label: "Type C board", next: "gothic_support", set: { boardType: "C" } },
    ],
  },
  gothic_support: {
    id: "gothic_support",
    kind: "step",
    style: "Gothic",
    title: "Support Strategy",
    body: "Pick support material for Gothic sewing.",
    images: ["12A", "13A", "14A"],
    options: [
      { label: "Split leather", next: "gothic_sewing", set: { support: "split-leather" } },
      { label: "Double cord", next: "gothic_sewing", set: { support: "double-cord" } },
      { label: "Twisted thong", next: "gothic_sewing", set: { support: "twisted-thong" } },
    ],
  },
  gothic_sewing: {
    id: "gothic_sewing",
    kind: "step",
    style: "Gothic",
    title: "Sewing Pattern",
    body: "Select the dominant sewing pattern.",
    images: ["16", "19", "20"],
    options: [
      { label: "Herringbone", next: "gothic_stations", set: { sewing: "herringbone" } },
      { label: "Straight", next: "gothic_stations", set: { sewing: "straight" } },
    ],
  },
  gothic_stations: {
    id: "gothic_stations",
    kind: "step",
    style: "Gothic",
    title: "Station Evidence",
    body: "Review head/tail station behavior.",
    images: ["21+22", "23+24", "86"],
    options: [
      { label: "Link-stitch station", next: "gothic_endband", set: { stations: "link" } },
      { label: "Span-stitch station", next: "gothic_endband", set: { stations: "span" } },
    ],
  },
  gothic_endband: {
    id: "gothic_endband",
    kind: "step",
    style: "Gothic",
    title: "Endband Type",
    body: "Choose the endband and tab profile.",
    images: ["86", "87", "52", "53"],
    options: [
      { label: "No endtab", next: "gothic_cover", set: { endband: "none" } },
      { label: "Square tab", next: "gothic_cover", set: { endband: "square" } },
      { label: "Round tab", next: "gothic_cover", set: { endband: "round" } },
    ],
  },
  gothic_cover: {
    id: "gothic_cover",
    kind: "step",
    style: "Gothic",
    title: "Cover/Corners",
    body: "Select corner and perimeter sewing treatment.",
    images: ["55", "56", "57", "59"],
    options: [
      { label: "Perimeter-sewn corners", next: "gothic_fastening", set: { cover: "perimeter" } },
      { label: "Mitred corners", next: "gothic_fastening", set: { cover: "mitred" } },
      { label: "Overcover", next: "gothic_fastening", set: { cover: "overcover" } },
    ],
  },
  gothic_fastening: {
    id: "gothic_fastening",
    kind: "step",
    style: "Gothic",
    title: "Fastening Family",
    body: "Finalize with regional fastening evidence.",
    images: ["65", "66", "67", "88", "69"],
    options: [
      { label: "English", next: "gothic_end", set: { fastening: "english" } },
      { label: "German", next: "gothic_end", set: { fastening: "german" } },
      { label: "Dutch", next: "gothic_end", set: { fastening: "dutch" } },
    ],
  },
  gothic_end: {
    id: "gothic_end",
    kind: "end",
    style: "Gothic",
    title: "Gothic Path Complete",
    body: "This Gothic branch is complete.",
    images: ["69"],
    options: [],
  },
};
