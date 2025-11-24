// /src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

import LandingPage from '@/components/LandingPage.vue'
import InputScreen from '@/components/InputScreen.vue'
import BookBindingScreen from '@/components/BookBindingScreen.vue'
import RulingMetadataScreen from '@/components/RulingMetadataScreen.vue'
import RulingScreen from '@/components/RulingScreen.vue'

const routes = [
  { path: '/', name: 'landing', component: LandingPage },
  { path: '/input-screen', name: 'input', component: InputScreen },
  {
    path: '/book-binding',
    name: 'bookBinding',
    component: BookBindingScreen,
    props: route => ({
      title: route.query.title,
      manuscriptDate: route.query.date,
      location: route.query.location,
      shelfmark: route.query.shelfmark,

      // ✅ Important: pass foliosPerQuire (what InputScreen sends)
      foliosPerQuire: Number(route.query.foliosPerQuire),
      // keep this for older links (optional)
      leavesPerQuire: Number(route.query.leavesPerQuire),

      quires: Number(route.query.quires),
      collationStyle: route.query.collationStyle,
      frontEndleaves: Number(route.query.frontEndleaves),
      backEndleaves: Number(route.query.backEndleaves),

      sewingSupports: Number(route.query.sewingSupports),
      headbands: route.query.headbands === 'true',
      changeOver: route.query.changeOver === 'true',
      spineLength: Number(route.query.spineLength),

      // passthroughs if present
      quiresStyle: route.query.quiresStyle,
      sewingType: route.query.sewingType,
    })
  },

  // 🔹 New: ruling metadata screen
  {
    path: '/ruling-metadata',
    name: 'rulingMetadata',
    component: RulingMetadataScreen,
  },

  // 🔹 New: ruling screen (takes metadata as props)
  {
    path: '/ruling',
    name: 'ruling',
    component: RulingScreen,
    props: route => ({
      shelfmark: route.query.shelfmark || '',
      siglum: route.query.siglum || '',
      folio: route.query.folio || '',
      widthCm: Number(route.query.widthCm) || 15,
      heightCm: Number(route.query.heightCm) || 20,
    }),
  },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
