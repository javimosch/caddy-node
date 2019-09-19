import 'core-js/stable'
import 'regenerator-runtime/runtime'
import Home from './containers/Home.vue'
// import './styles/main.scss'

Vue.use(VueRouter)

const routes = [
    { path: '/home', component: Home, name: 'home' },
    {
        path: '*',
        component: {
            mounted() {
                setTimeout(() => {
                    this.$router.push({ name: 'home' })
                }, 2000)
            }
        }
    }
]

const router = new VueRouter({
    routes
})

new Vue({
    el: '.app',
    components: {},
    router
})