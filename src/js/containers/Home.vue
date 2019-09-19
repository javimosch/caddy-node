

<template>
  <div class="home">
    <h2>HOME CONTAINER 4</h2>
    <ul>
      <li v-for="(site) in sites" :key="site.identifier">
        <h5 v-html="site.identifier"></h5>
        <label>Domain</label>
        <input v-model="site.domain" />
        <div>
          <label>
            <input type="checkbox" v-model="site.https" />
            <span class="checkable">Https</span>
          </label>
        </div>
        <label>Root</label>
        <input v-model="site.root" />
      </li>
    </ul>
    <button @click="save">Save</button>
  </div>
</template>
<script>
import api from "../api";
export default {
  components: {},
  mixins: [],
  data() {
    return {
      sites: [{ identifier: "pelo" }]
    };
  },
  methods: {
    async save() {
      await api.funql("saveSites", [[].concat(this.sites)]);
    }
  },
  computed: {},
  async mounted() {
    this.sites = await api.funql("getSites");
  }
};
</script>
<style scoped>
.home {
  margin: 5px;
}
</style>