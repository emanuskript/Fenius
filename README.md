**Fenius** is a Vue.js single-page application for simulating historical bookbinding structures. It guides you through:

1. **Manuscript metadata entry** (title, date, repository, shelfmark)
2. **Spine configuration** (number of quires, foliation vs pagination, sewing supports, spine length, endleaves, headbands, change-over stations)
3. **Interactive spine visualization**

   * Auto-generated rows for front endleaves, quires & back endleaves
   * Drag-and-drop ruler with real-time centimeter tooltip
   * Movable colored bars and dots for headbands, sewing supports, change-over stations & sewing holes
   * Editable notes per row
4. **Drawing tools (“Pens”)** for annotating stitches:

   * Internal & external thread presets, plus up to 3 custom pens
   * Configurable label, tip size, color-blind palette, draw/line/curve/pattern modes

---

## Features

* **Landing page**: “Create new” or import a VCEditor JSON
* **Input screen**: Collect all spine parameters with guided tooltips
* **Book-binding screen**: Render a table-based spine diagram
* **Interactive ruler**: Shows cm scale, major/minor ticks, dynamic tooltip
* **Legend & controls**: Add/remove headbands, supports, holes, change-overs
* **Editable notes**: Free-form text per quire/endleaf row
* **Pen tools**: Pop-up modals for thread annotations
* **Responsive CSS** matching a professional gray-blue palette

---

## Tech Stack

* **Vue.js 3** with Composition API & `<script setup>`
* **Vue Router** for SPA navigation
* **HTML5 & CSS3** (Flexbox, Grid, scoped styles)
* **JavaScript ES6+**

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/your-username/fenius.git
cd fenius

# Install dependencies
npm install

# Run the development server
npm run dev

# Build for production
npm run build

# Preview the production build
npm run serve
```

---

## Project Structure

```
fenius/
├─ public/
│  └─ index.html
├─ src/
│  ├─ assets/
│  ├─ components/
│  │  ├─ LandingPage.vue
│  │  ├─ InputScreen.vue
│  │  └─ BookBindingScreen.vue
│  ├─ router/
│  │  └─ index.js
│  ├─ App.vue
│  └─ main.js
├─ .gitignore
├─ package.json
└─ README.md
```

---

## Contributing

1. Fork the repo
2. Create a branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m "Add feature"`)
4. Push to your branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the [MIT License](LICENSE).

