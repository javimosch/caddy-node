

<template>
  <div class="home">
    <h2 v-html="enviromentTitle"></h2>
    <label v-show="gatewayIp">Docker Gateway IP (Host Proxy)</label>
    <h4 v-show="gatewayIp">{{gatewayIp}}</h4>
    <ul>
      <li v-for="(site) in sites" :key="site.identifier">
        <div class="flex one two-600">
          <div>
            <label>Domain</label>
            <input v-model="site.domain" />
            <p>
              Preview:
              <a
                :href="getDomainPreview(site)"
                v-html="getDomainPreview(site)"
                target="_blank"
              ></a>
            </p>
            <div>
              <label>
                <input type="checkbox" v-model="site.https" />
                <span class="toggle pseudo button">Https</span>
              </label>
            </div>
            <div v-show="!isLocal">
              <label>
                <input type="checkbox" v-model="site.wildcard_cert" />
                <span class="toggle pseudo button">wildcard_cert</span>
              </label>
            </div>
          </div>
          <div>
            <label>Root</label>
            <input v-model="site.root" />
            <label>Proxy</label>
            <input v-model="site.proxy" />
          </div>
        </div>
        <div>
          <label>
            <input type="checkbox" v-model="site.basic_auth" />
            <span class="toggle pseudo button">basic_auth</span>
          </label>
        </div>
        <button class="warning" @click="remove(site)">Remove</button>
      </li>
    </ul>

    <button @click="add">Add</button>
    <button @click="save">Save</button>
    <button @click="exportConfig">Export</button>
    <button @click="importConfig">Import</button>

    <h3>Preview</h3>
    <p>This is just a representation of the final version</p>
    <textarea v-html="previewResult"></textarea>
    <h3>Last Caddy logs</h3>
    <textarea v-html="lastLogs"></textarea>
  </div>
</template>
<script>
import api from "../api";
export default {
  components: {},
  mixins: [],
  data() {
    return {
      lastLogs: "",
      sites: [{ identifier: "pelo" }],
      isLocal: false,
      gatewayIp: ""
    };
  },
  methods: {
    async save() {
      if (
        this.isLocal ||
        (!!this.isLocal &&
          window.config(
            "Configuration will be overwritted. Caddy can explode. Sure?"
          ))
      ) {
        this.cleanInvalidSites();
        this.normalizeSites();
        await api.funql("saveSites", [[].concat(this.sites)]);
      }

      alert("Done");
    },
    getFileDialogContent() {
      return new Promise((resolve, reject) => {
        var input = document.createElement("input");
        input.type = "file";

        input.onchange = e => {
          // getting a hold of the file reference
          var file = e.target.files[0];

          // setting up the reader
          var reader = new FileReader();
          reader.readAsText(file, "UTF-8");

          // here we tell the reader what to do when it's done reading...
          reader.onload = readerEvent => {
            var content = readerEvent.target.result; // this is the content!
            resolve(content);
          };
        };

        input.click();
      });
    },
    async importConfig() {
      let config = await this.getFileDialogContent();
      if (
        window.confirm("Your current configuration will be replaced. Sure?")
      ) {
        config = JSON.parse(config);
        this.sites = Object.keys(config).map(key => {
          return Object.assign(config[key], {
            identifier: key
          });
        });
      }
    },
    async exportConfig() {
      let config = await api.funql("getCaddyNodeConfig");
      downloadObjectAsJson(config, `caddynode-config`);
      function downloadObjectAsJson(exportObj, exportName) {
        var dataStr =
          "data:text/json;charset=utf-8," +
          encodeURIComponent(JSON.stringify(exportObj));
        var downloadAnchorNode = document.createElement("a");
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", exportName + ".json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
      }
    },
    normalizeSites() {
      this.sites = this.sites.map(site => {
        site.identifier = site.domain;
        site.wildcard_cert = this.isLocal ? false : site.wildcard_cert;
        return site;
      });
    },
    cleanInvalidSites() {
      this.sites = this.sites.filter(site => {
        return (
          !!site.domain && (!!site.root || !!site.proxy) && !!site.identifier
        );
      });
    },
    async getDockerGateway() {
      return await api.funql("getDockerGateway");
    },
    remove(item) {
      this.sites = this.sites.filter(site => {
        return site.domain != item.domain;
      });
    },
    add() {
      this.sites.push({
        identifier: "new-site-" + (this.sites.length + 1),
        domain: "",
        https: false,
        root: "",
        proxy: ""
      });
    },
    getDomainPreview(site) {
      if (!!!site.domain) return;
      let https = site.https ? "https" : "http";
      let domain = site.domain;
      if (this.isLocal) {
        domain = domain.substring(0, domain.lastIndexOf(".")) + ".local";
      }
      return https + `://` + domain;
    },

    async logsWatcher() {
      api.funql("getCaddyLastLogs").then(res => {
        this.lastLogs = res.result;
      });
    },
    startLogsWatcher() {
      setInterval(this.logsWatcher, 5000);
    }
  },
  computed: {
    enviromentTitle() {
      if (this.isLocal) {
        return `Development mode (localhost)`;
      } else {
        return `Production mode`;
      }
    },
    previewResult() {
      let caddyfileRaw = ``;
      this.sites.forEach(site => {
        if (!site.domain) return;
        if (!site.root && !site.proxy) return;
        if (site.domain.indexOf(".") === -1) return;
        let domain = this.isLocal
          ? site.domain.substring(0, site.domain.lastIndexOf(".")) + ".local"
          : site.domain;

        let proxyOrRoot = site.root
          ? `root ${site.root}`
          : `proxy / ${site.proxy}`;
        let wildcard_cert = site.wildcard_cert
          ? `
    import wildcard_cert`
          : "";
        let tls =
          site.https && this.isLocal
            ? `
    tls self_signed`
            : "";
        let basic_auth = site.basic_auth
          ? `
    basicauth / root {%CADDY_NODE_ROOT_PWD%}`
          : "";
        caddyfileRaw += `
${site.https ? "https" : "http"}://${domain} {${wildcard_cert}
    ${proxyOrRoot}${tls}${basic_auth}
}
`;
      });
      return caddyfileRaw;
    }
  },

  destroyed() {
    clearInterval(this.logsWatcher);
  },
  async mounted() {
    this.startLogsWatcher();
    this.getDockerGateway().then(ip => {
      this.gatewayIp = ip;
    });
    this.isLocal = await api.funql("isLocalhost");
    this.sites = await api.funql("getSites");
    function test() {
      this.isLocal = false;
      this.sites = [
        {
          identifier: "montech_test",
          domain: "montech.es",
          https: true,
          root: "public_html"
        }
      ];
    }
  }
};
</script>
<style scoped>
.home {
  margin: 10px;
}
ul {
  margin: 0px;
  padding: 0px;
}
li {
  padding: 20px;
  background-color: #d3f1f1;
}
.title {
  background: transparent;
  margin: 20px 0px;
  font-size: 25px;
}
label {
  font-size: 14px;
  font-weight: bold;
}
input {
  margin: 0px 0px 10px 0px;
  font-size: 14px;
}
p {
  margin: 0px;
  font-size: 12px;
}
textarea {
  font-size: 12px;
  min-height: 200px;
}
.warning {
  font-size: 10px;
}
</style>