// /src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

import LandingPage from '@/components/LandingPage.vue'
import InputScreen from '@/components/InputScreen.vue'
import BookBindingScreen from '@/components/BookBindingScreen.vue'

const routes = [
    { path: '/', name: 'landing', component: LandingPage },
    { path: '/input-screen', name: 'input', component: InputScreen },
    {
        path: '/book-binding', name: 'bookBinding',
        component: BookBindingScreen,
        // tell Vue Router to take all query params and pass them as props
        props: route => ({
            title: route.query.title,
            manuscriptDate: route.query.date,
            location: route.query.location,
            shelfmark: route.query.shelfmark,
            quires: Number(route.query.quires),
            leavesPerQuire: Number(route.query.leavesPerQuire),
            sewingSupports: Number(route.query.sewingSupports),
            headbands: route.query.headbands === 'true',
            changeOver: route.query.changeOver === 'true',
            spineLength: Number(route.query.spineLength)
        })
    },
]

export default createRouter({
    history: createWebHistory(),
    routes,
})
